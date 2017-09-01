$(document).ready(function () {
    $(".manipulate").click(handleData);
});
function handleData() {
    var base = $(this);
    var target = $(base.attr("target"));
    var data = base.attr("attr-data");
    var text = base.attr("text-data");
    if (data && data.length > 0)
        loop(JSON.parse(data), function (key, value) { return target.attr(key, value); });
    if (text && text.length > 0)
        target.text(text);
}
function loop(data, f) {
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            f(key, data[key]);
        }
    }
}
function fixError(error) {
    if (typeof error == 'string')
        return error;
    else if (error.message)
        return error.message;
    else {
        console.log(error);
        return "An error occured, but it could not be displayed properly. See the console of the browser for more information.";
    }
}
var Dict = (function () {
    function Dict() {
        this.objs = {};
    }
    Dict.prototype.put = function (id, a) {
        this.objs[id] = a;
    };
    Dict.prototype.get = function (id) {
        return this.objs[id];
    };
    Dict.prototype.keys = function () {
        return this.toArr(function (key, value) { return key; });
    };
    Dict.prototype.values = function () {
        return this.toArr(function (key, value) { return value; });
    };
    Dict.prototype.toArr = function (f) {
        var collection = [];
        loop(this.objs, function (key, value) {
            collection.push(f(key, value));
        });
        return collection;
    };
    return Dict;
}());
//this way values are calculated way to often, just lazy and reset when renew
var Field = (function () {
    function Field(id, name, jq, value) {
        this.id = id;
        this.name = name;
        this.jq = jq;
        this.value = function () { return value(jq); };
        this.value_raw = value;
    }
    return Field;
}());
var Validator = (function () {
    function Validator(f) {
        var targets = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            targets[_i - 1] = arguments[_i];
        }
        this.error = true;
        this.targets = targets;
        this.f = f;
    }
    Validator.prototype.disableErrors = function () {
        this.error = false;
        return this;
    };
    Validator.prototype.exec = function (modal) {
        var targets = this.targets.map(function (t) { return modal.fields.get(t); });
        var error = this.f.apply(this, [modal].concat(targets));
        if (error.length > 0 && this.error)
            targets.forEach(function (t) { return t.jq.addClass("is-invalid"); });
        return error;
    };
    Validator.validate = function (modal) {
        var vals = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            vals[_i - 1] = arguments[_i];
        }
        var errors = [];
        for (var _a = 0, vals_1 = vals; _a < vals_1.length; _a++) {
            var val = vals_1[_a];
            var error = val.exec(modal);
            if (error.length > 0)
                errors.push.apply(errors, error);
        }
        return errors;
    };
    return Validator;
}());
var ModalFormValidator = (function () {
    function ModalFormValidator(id, send, receive, multiUse) {
        if (multiUse === void 0) { multiUse = false; }
        var _this = this;
        this.validators = [];
        this.values = [];
        this.fields = new Dict();
        this.openListners = [];
        this.modal = $(id);
        this.sendId = send;
        this.button = this.modal.find(".modal-run");
        this.errorMessage = this.modal.find(".errors");
        this.errorContainer = this.modal.find(".errorContainer");
        this.button.click(function () { return _this.run(); });
        this.modal.on("show.bs.modal", function () { return _this.modalOpened(multiUse); });
        socket.on(receive, function (success, error) { return _this.response(success, error); });
    }
    ModalFormValidator.prototype.response = function (success, error) {
        if (success) {
            if (this.successHandler) {
                this.stopRunning();
                this.successHandler();
            }
            else
                location.reload();
        }
        else {
            this.stopRunning();
            this.showError();
            this.clearError();
            this.addError(fixError(error));
        }
    };
    ModalFormValidator.prototype.modalOpened = function (multiUse) {
        if (multiUse) {
            this.clearError();
            this.hideError();
            loop(this.fields.objs, function (key, value) {
                value.jq.removeClass("is-invalid");
            });
        }
        var instance = this;
        this.openListners.forEach(function (l) { return l(instance); });
    };
    ModalFormValidator.prototype.onOpen = function (f) {
        this.openListners.push(f);
    };
    ModalFormValidator.prototype.copyFrom = function (other, id, validators) {
        var _this = this;
        if (validators === void 0) { validators = true; }
        loop(other.fields.objs, function (key, value) {
            _this.registerField(key, value.name, "#" + id + value.id.substr(1), value.value_raw);
        });
        this.addValues.apply(this, other.values);
        if (validators)
            for (var _i = 0, _a = other.validators; _i < _a.length; _i++) {
                var val = _a[_i];
                this.addValidation(val);
            }
    };
    ModalFormValidator.prototype.run = function () {
        var _this = this;
        if (!this.isRunning()) {
            var errors = [];
            loop(this.fields.objs, function (key, value) {
                value.jq.removeClass("is-invalid");
            });
            for (var _i = 0, _a = this.validators; _i < _a.length; _i++) {
                var val = _a[_i];
                var error = val.exec(this);
                if (error.length > 0)
                    errors.push.apply(errors, error);
            }
            if (errors.length > 0) {
                this.clearError();
                this.showError();
                errors.forEach(function (e) { return _this.addError(e); });
            }
            else {
                this.hideError();
                socket.emit.apply(socket, [this.sendId].concat(this.values, this.fields.values().map(function (f) { return f.value(); })));
                this.setRunning();
            }
        }
    };
    ModalFormValidator.prototype.setRunning = function () {
        this.button.addClass("running");
        this.button.prop("disabled", true);
    };
    ModalFormValidator.prototype.stopRunning = function () {
        this.button.removeClass("running");
        this.button.prop("disabled", false);
    };
    ModalFormValidator.prototype.isRunning = function () {
        this.button.hasClass("running");
    };
    ModalFormValidator.prototype.clearError = function () {
        this.errorMessage.html("");
    };
    ModalFormValidator.prototype.showError = function () {
        this.errorContainer.removeClass("hidden");
    };
    ModalFormValidator.prototype.hideError = function () {
        this.errorContainer.addClass("hidden");
    };
    ModalFormValidator.prototype.onChange = function (field, callback) {
        var _this = this;
        this.fields.get(field).jq.on("input", function (e) {
            callback(_this.fields.get(field).value());
        });
    };
    ModalFormValidator.prototype.setAttribute = function (field, attribute, value) {
        this.fields.get(field).jq.attr(attribute, value);
    };
    ModalFormValidator.prototype.setProp = function (field, attribute, value) {
        this.fields.get(field).jq.prop(attribute, value);
    };
    ModalFormValidator.prototype.onSuccess = function (handler, reload) {
        var _this = this;
        if (reload === void 0) { reload = false; }
        this.successHandler = function () {
            _this.close();
            handler();
            if (reload)
                location.reload();
        };
    };
    ModalFormValidator.prototype.close = function () {
        this.modal.modal("hide");
    };
    ModalFormValidator.prototype.addError = function (error) {
        var li = document.createElement("li");
        li.innerText = error;
        this.errorMessage.append(li);
    };
    ModalFormValidator.prototype.setTextValue = function (field, value) {
        this.getJq(field).text(value);
    };
    ModalFormValidator.prototype.setValue = function (field, value) {
        this.getJq(field).val(value);
    };
    ModalFormValidator.prototype.getValue = function (field) {
        return this.actField(field, function (f) { return f.value(); });
    };
    ModalFormValidator.prototype.getName = function (field) {
        return this.actField(field, function (f) { return f.name; });
    };
    ModalFormValidator.prototype.getJq = function (field) {
        return this.actField(field, function (f) { return f.jq; });
    };
    ModalFormValidator.prototype.actField = function (field, f) {
        var val = this.fields.get(field);
        if (val)
            return f(val);
        else
            "";
    };
    ModalFormValidator.prototype.registerField = function (shortHand, name, id, value, insideModal) {
        if (insideModal === void 0) { insideModal = true; }
        var jq = insideModal ? this.modal.find(id) : $(id);
        this.fields.put(shortHand, new Field(id, name, jq, value));
    };
    ModalFormValidator.prototype.addValues = function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.values).push.apply(_a, values);
        var _a;
    };
    ModalFormValidator.prototype.addValidation = function (valid) {
        this.validators.push(valid);
    };
    return ModalFormValidator;
}());
var ModalValues;
(function (ModalValues) {
    function value(target) {
        return target.val();
    }
    ModalValues.value = value;
    function attr(atr) {
        return function (target) { return target.attr(atr); };
    }
    ModalValues.attr = attr;
    function date(target) {
        var date = target.parent().datepicker("getDate");
        if (date)
            date.setTime(date.getTime() + (1000 * 60 * 60 * 24) - 1);
        return date;
    }
    ModalValues.date = date;
})(ModalValues || (ModalValues = {}));
var ModalValidators;
(function (ModalValidators) {
    function atLeast(length) {
        return function (modal, field) {
            var value = field.value();
            if (value.length >= length)
                return [];
            else
                return ["The " + field.name + " must be at least " + length.toString() + " characters long!"];
        };
    }
    ModalValidators.atLeast = atLeast;
    function minSize(length) {
        return function (modal, field) {
            var value = field.value();
            console.log(value);
            if (value.length >= length)
                return [];
            else
                return ["At least " + length + " should be selected from " + field.name + "!"];
        };
    }
    ModalValidators.minSize = minSize;
    function equals() {
        var list = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            list[_i] = arguments[_i];
        }
        return function (modal, field) {
            var value = field.value();
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var val = list_1[_i];
                if (value == val)
                    return [];
            }
            return ["Field " + field.name + " has an invalid value!"];
        };
    }
    ModalValidators.equals = equals;
    function or(pred, error) {
        return function (modal) {
            var fields = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fields[_i - 1] = arguments[_i];
            }
            for (var _a = 0, fields_1 = fields; _a < fields_1.length; _a++) {
                var field = fields_1[_a];
                if (pred(field.value()))
                    return [];
            }
            return [error];
        };
    }
    ModalValidators.or = or;
    function exists() {
        return function (modal, field) {
            if (!field.value())
                return ["The " + field.name + " format is incorrect!"];
            else
                return [];
        };
    }
    ModalValidators.exists = exists;
    function not(data, error) {
        return function (modal, field) {
            if (field.value() == data)
                return [error];
            else
                return [];
        };
    }
    ModalValidators.not = not;
    function ifthen(pred) {
        var then = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            then[_i - 1] = arguments[_i];
        }
        return function (modal, field) {
            if (pred(field.value()))
                return Validator.validate.apply(Validator, [modal].concat(then));
            else
                return [];
        };
    }
    ModalValidators.ifthen = ifthen;
    function ifValid(pred) {
        var then = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            then[_i - 1] = arguments[_i];
        }
        return function (modal, field) {
            var error = pred.exec(modal);
            if (error.length == 0)
                return Validator.validate.apply(Validator, [modal].concat(then));
            else
                return error;
        };
    }
    ModalValidators.ifValid = ifValid;
    function dateOrder() {
        return function (modal, start, end) {
            var startDate = start.value();
            var endDate = end.value();
            if (!!startDate && !!endDate && startDate >= endDate)
                return ["The " + start.name + " has to be before the " + end.name + "!"];
            else
                return [];
        };
    }
    ModalValidators.dateOrder = dateOrder;
    function inbetweenDates(start, end) {
        return function (modal, date) {
            var dateDate = date.value();
            console.log(dateDate);
            console.log(start);
            console.log(end);
            if (dateDiff(start, dateDate) < 0)
                return ["The " + date.name + " has to be after or on " + dateString(start, start.getFullYear() != dateDate.getFullYear()) + "!"];
            else if (dateDiff(dateDate, end) < 0)
                return ["The " + date.name + " has to be before or on " + dateString(end, end.getFullYear() != dateDate.getFullYear()) + "!"];
            else
                return [];
        };
    }
    ModalValidators.inbetweenDates = inbetweenDates;
    function validURL() {
        return function (modal, field) {
            if (!URLValid(field.value()))
                return ["The url of " + field.name + " is not valid!"];
            else
                return [];
        };
    }
    ModalValidators.validURL = validURL;
    function idNotExists(id, error) {
        return function (field) {
            if ($("#" + id).length > 0)
                return [error];
            else
                return [];
        };
    }
    ModalValidators.idNotExists = idNotExists;
    function dateDiff(begin, end) {
        var diff = end.getTime() - begin.getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    }
    function dateString(date, year) {
        var str = (date.getDate()) + " " + months[date.getMonth()];
        if (year)
            return str + " " + date.getFullYear().toString().substr(2, 2);
        else
            return str;
    }
})(ModalValidators || (ModalValidators = {}));
function URLValid(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i');
    if (!pattern.test(str))
        return false;
    else
        return true;
}
$(".date").datepicker().on('show.bs.modal', function (event) { return event.stopPropagation(); });
