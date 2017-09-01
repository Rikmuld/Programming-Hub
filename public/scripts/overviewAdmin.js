var otherUsers = [];
var nonUsers;
$(document).ready(function () {
    function getGroupId() {
        return $("#group_data").attr("group");
    }
    function getStartDate() {
        return new Date($("#group_data").attr("start"));
    }
    function getEndDate() {
        return new Date($("#group_data").attr("end"));
    }
    var assignmentCreate = new ModalFormValidator("#addAssignment", "createAssignment", "assignmentCreated");
    assignmentCreate.addValues(getGroupId());
    assignmentCreate.registerField("name", "assignment name", "#assignmentName", ModalValues.value);
    assignmentCreate.registerField("type", "assignment type", "#assignmentType", ModalValues.value);
    assignmentCreate.registerField("due", "due date", "#due", ModalValues.date);
    assignmentCreate.registerField("link", "additional info link", "#infoLink", ModalValues.value);
    assignmentCreate.onChange("type", function (value) {
        if (value == "open") {
            assignmentCreate.setValue("name", "Free Assignment");
            assignmentCreate.setProp("name", "disabled", true);
        }
        else {
            assignmentCreate.setValue("name", "");
            assignmentCreate.setProp("name", "disabled", false);
        }
    });
    assignmentCreate.onOpen(function () {
        if (assignmentCreate.getValue("type") == "open")
            assignmentCreate.setProp("name", "disabled", true);
        else
            assignmentCreate.setProp("name", "disabled", false);
    });
    var nameValid = new Validator(ModalValidators.atLeast(8), "name");
    var nameValid2 = new Validator(ModalValidators.equals("Free Assignment"), "name");
    var dueExists = new Validator(ModalValidators.exists(), "due");
    var dueValid = new Validator(ModalValidators.inbetweenDates(getStartDate(), getEndDate()), "due");
    var ifDue = new Validator(ModalValidators.ifValid(dueExists, dueValid), "due");
    var validURL = new Validator(ModalValidators.validURL(), "link");
    var ifLink = new Validator(ModalValidators.ifthen(function (s) { return s.length > 0; }, validURL), "link");
    var noOpen = new Validator(ModalValidators.idNotExists("openExists", "There can only be one open assignment per course!"), "type");
    var ifTypeDefined = new Validator(ModalValidators.ifthen(function (s) { return s == "defined"; }, nameValid, ifDue, ifLink), "type").disableErrors();
    var ifTypeOpen = new Validator(ModalValidators.ifthen(function (s) { return s == "open"; }, nameValid, nameValid2, noOpen), "type").disableErrors();
    assignmentCreate.addValidation(new Validator(ModalValidators.not("autograder", "The autograder type is not available for now!"), "type"));
    assignmentCreate.addValidation(ifTypeDefined);
    assignmentCreate.addValidation(ifTypeOpen);
    assignmentCreate.addValidation(new Validator(ModalValidators.equals("autograder", "open", "defined"), "type"));
    var assignmentUpdate = new ModalFormValidator("#editAssignment", "updateAssignment", "assignmentUpdated", true);
    assignmentUpdate.registerField("assignment", "assignment id", "#editAssignment", ModalValues.attr("assignment"), false);
    assignmentUpdate.copyFrom(assignmentCreate, "update_", false);
    assignmentUpdate.onOpen(function (mod) {
        mod.setValue("name", mod.modal.attr("name"));
        mod.setValue("link", mod.modal.attr("link"));
        var duePar = mod.getJq("due").parent();
        duePar.datepicker('setDate', new Date(mod.modal.attr("due")));
        mod.setValue("type", mod.modal.attr("type"));
        selectClicked(mod.getJq("type"));
    });
    assignmentUpdate.addValidation(new Validator(ModalValidators.ifthen(function (s) { return s == "open"; }, nameValid), "type").disableErrors());
    assignmentUpdate.addValidation(ifTypeDefined);
    var removeAssignment = new ModalFormValidator("#removeAssignment", "removeAssignment", "assignmentRemoved", true);
    removeAssignment.registerField("assignment", "assignment id", "#removeAssignmentName", ModalValues.attr("assignment"));
    removeAssignment.onSuccess(function () {
        var assignment = removeAssignment.getValue("assignment");
        var card = $("#" + assignment).parent();
        var cardContainer = card.parent();
        card.fadeOut(400, function () {
            card.remove();
            if (cardContainer.children().length == 0) {
                var section = cardContainer.parent();
                cardContainer.remove();
                $("#noAssignmentMessage").fadeIn();
            }
        });
    });
    var removeUser = new ModalFormValidator("#removeUser", "removeUser", "userRemoved", true);
    removeUser.addValues(getGroupId(), false);
    removeUser.registerField("user", "user id", "#removeUserName", ModalValues.attr("user"));
    removeUser.onSuccess(function () {
        var user = removeUser.getValue("user");
        otherUsers.push({
            _id: user,
            name: $("#" + user.replace(/\./g, "")).attr("name"),
            surename: $("#" + user.replace(/\./g, "")).attr("surename")
        });
        usersGot(null);
        var card = $("#" + user.replace(/\./g, "")).parent();
        var cardContainer = card.parent();
        card.fadeOut(400, function () {
            card.remove();
            if (cardContainer.children().length == 0) {
                var section = cardContainer.parent();
                cardContainer.remove();
                $("#mailAllButton").hide();
                $("#noStudentMessage").fadeIn();
            }
        });
    });
    var addUsers = new ModalFormValidator("#addUsers", "addUsers", "usersAdded");
    addUsers.addValues(getGroupId(), "student");
    addUsers.registerField("users", "users", "#allUserList", getSelected);
    addUsers.addValidation(new Validator(ModalValidators.minSize(1), "users"));
    socket.on('usersGot', usersGot);
});
function getUsers(users) {
    if (!nonUsers)
        socket.emit("getUsers", JSON.parse(users));
}
function usersGot(users) {
    if (users)
        nonUsers = users;
    var allUsers = [];
    allUsers.push.apply(allUsers, nonUsers);
    allUsers.push.apply(allUsers, otherUsers);
    $("#allUserList").html("");
    for (var _i = 0, allUsers_1 = allUsers; _i < allUsers_1.length; _i++) {
        var user = allUsers_1[_i];
        var li = document.createElement("li");
        li.classList.add("list-group-item");
        li.innerText = user.name + " " + user.surename + " (" + user._id + ")";
        li.setAttribute("value", user._id);
        $("#allUserList").append(li);
    }
    if (allUsers.length == 0) {
        var p = document.createElement("span");
        p.innerText = "There are no available users to add!";
        $("#allUserList").append(p);
    }
    else
        initListGroup($("#allUserList"));
}
function mailUsers(students) {
    var mailUsers = students.split(',').filter(function (s) { return otherUsers.findIndex(function (s2) { return s2._id == s; }) == -1; }).map(function (s) { return s + "@student.utwente.nl,"; });
    window.location.href = "mailto:?bcc=" + mailUsers;
}
