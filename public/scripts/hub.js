$(document).ready(function () {
    var modCreate = new ModalFormValidator("#addCourse", "createCourse", "courseCreated");
    modCreate.registerField("name", "course name", "#courseName", ModalValues.value);
    modCreate.registerField("start", "start date", "#courseStart", ModalValues.date);
    modCreate.registerField("end", "end date", "#courseEnd", ModalValues.date);
    modCreate.addValidation(new Validator(ModalValidators.atLeast(8), "name"));
    modCreate.addValidation(new Validator(ModalValidators.exists(), "start"));
    modCreate.addValidation(new Validator(ModalValidators.exists(), "end"));
    modCreate.addValidation(new Validator(ModalValidators.dateOrder(), "start", "end"));
    var modUpdate = new ModalFormValidator("#updateCourse", "updateCourse", "courseUpdated");
    modUpdate.registerField("course", "course id", "#update_courseName", ModalValues.attr("course"));
    modUpdate.copyFrom(modCreate, "update_");
    modUpdate.onOpen(function (mod) {
        var name = mod.getJq("name");
        var start = name.attr("start");
        var end = name.attr("end");
        var startPar = mod.getJq("start").parent();
        startPar.datepicker('setDate', new Date(start));
        var endPar = mod.getJq("end").parent();
        endPar.datepicker('setDate', new Date(end));
    });
    var modDelete = new ModalFormValidator("#removeCourse", "removeCourse", "courseRemoved");
    modDelete.registerField("course", "course id", "#removeCourseName", ModalValues.attr("course"));
    modDelete.onSuccess(function () {
        var course = modDelete.getValue("course");
        var card = $("#" + course).parent();
        var cardContainer = card.parent();
        card.fadeOut(400, function () {
            card.remove();
            if (cardContainer.children().length == 0) {
                var section = cardContainer.parent();
                cardContainer.remove();
                $("#noCourseMessage").fadeIn();
            }
        });
    });
    $(".courseCard").hover(function () {
        var card = $(this);
        var info = card.find(".progress span");
        var currInfo = info.text();
        var newInfo = info.attr("dateInfo");
        info.text(newInfo);
        info.attr("dateInfo", currInfo);
    });
});
