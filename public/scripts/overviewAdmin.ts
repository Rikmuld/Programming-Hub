declare function getSelected(container): string[]

$(document).ready(() => {
    const assignmentCreate = new ModalFormValidator("#addAssignment", "createAssignment", "assignmentCreated")
    assignmentCreate.addValues(getGroupId())
    assignmentCreate.registerField("name", "assignment name", "#assignmentName", ModalValues.value)
    assignmentCreate.registerField("type", "assignment type", "#assignmentType", ModalValues.value)
    assignmentCreate.registerField("due", "due date", "#due", ModalValues.date)
    assignmentCreate.registerField("link", "additional info link", "#infoLink", ModalValues.value)
    assignmentCreate.onChange("type", (value: string) => {
        if(value == "open") {
            assignmentCreate.setValue("name", "Free Assignment")
            assignmentCreate.setProp("name", "disabled", true)
        } else {
            assignmentCreate.setValue("name", "")
            assignmentCreate.setProp("name", "disabled", false)
        }
    })
    assignmentCreate.onOpen(() => {
        if(assignmentCreate.getValue("type") == "open") assignmentCreate.setProp("name", "disabled", true)
        else assignmentCreate.setProp("name", "disabled", false)
    })

    const nameValid = new Validator(ModalValidators.atLeast(8), "name")

    const dueExists = new Validator(ModalValidators.exists(), "due")
    const dueValid = new Validator(ModalValidators.inbetweenDates(getStartDate(), getEndDate()), "due")
    const ifDue = new Validator(ModalValidators.ifValid(dueExists, dueValid), "due")

    const validURL = new Validator(ModalValidators.validURL(), "link")
    const ifLink = new Validator(ModalValidators.ifthen(s => s.length > 0, validURL), "link")

    const noOpen = new Validator(ModalValidators.idNotExists("openExists", "There can only be one open assignment per course!"), "type")

    const ifTypeDefined = new Validator(ModalValidators.ifthen(s => s == "defined", nameValid, ifDue, ifLink), "type").disableErrors()
    const ifTypeOpen = new Validator(ModalValidators.ifthen(s => s == "open", nameValid, noOpen), "type").disableErrors()

    assignmentCreate.addValidation(new Validator(ModalValidators.not("autograder", "The autograder type is not available for now!"), "type"))
    assignmentCreate.addValidation(ifTypeDefined)
    assignmentCreate.addValidation(ifTypeOpen)
    assignmentCreate.addValidation(new Validator(ModalValidators.equals("autograder", "open", "defined"), "type"))

    const assignmentUpdate = new ModalFormValidator("#editAssignment", "updateAssignment", "assignmentUpdated", true)
    assignmentUpdate.registerField("assignment", "assignment id", "#editAssignment", ModalValues.attr("assignment"), false)
    assignmentUpdate.copyFrom(assignmentCreate, "update_", false)
    assignmentUpdate.onOpen((mod) => {
        mod.setValue("name", mod.modal.attr("name"))
        mod.setValue("link", mod.modal.attr("link"))
        
        const duePar = mod.getJq("due").parent() as any
        duePar.datepicker('setDate', new Date(mod.modal.attr("due")))
        mod.setValue("type", mod.modal.attr("type"))

        console.log(mod.getValue("assignment"))
        console.log(mod.getJq("assignment"))

        selectClicked(mod.getJq("type"))
    })

    assignmentUpdate.addValidation(new Validator(ModalValidators.ifthen(s => s == "open", nameValid), "type").disableErrors())
    assignmentUpdate.addValidation(ifTypeDefined)

    const removeAssignment = new ModalFormValidator("#removeAssignment", "removeAssignment", "assignmentRemoved", true)
    removeAssignment.registerField("assignment", "assignment id", "#removeAssignmentName", ModalValues.attr("assignment"))

    const removeUser = new ModalFormValidator("#removeUser", "removeUser", "userRemoved", true)
    removeUser.addValues(getGroupId(), false)
    removeUser.registerField("user", "user id", "#removeUserName", ModalValues.attr("user"))

    const addUsers = new ModalFormValidator("#addUsers", "addUsers", "usersAdded")
    addUsers.addValues(getGroupId(), "student")
    addUsers.registerField("users", "users", "#allUserList", getSelected)
    addUsers.addValidation(new Validator(ModalValidators.minSize(1), "users"))

    socket.on('usersGot', usersGot)
})

function getGroupId() {
    return $("#group_data").attr("group")
}

function getStartDate(): Date {
    return new Date($("#group_data").attr("start"))
}

function getEndDate(): Date {
    return new Date($("#group_data").attr("end"))
}

function getUsers(users: string) {
    if ($("#allUserList").html().length == 0) socket.emit("getUsers", JSON.parse(users))
}

declare function initListGroup(container)

function usersGot(users: any[]) {
    $("#allUserList").html("")
    for (let user of users) {
        const li = document.createElement("li")
        li.classList.add("list-group-item")
        li.innerText = user.name + " " + user.surename + " (" + user._id + ")"
        li.setAttribute("value", user._id)
        $("#allUserList").append(li)
    }

    if (users.length == 0) {
        const p = document.createElement("span")
        p.innerText = "There are no available users to add!"
        $("#allUserList").append(p)
    } else initListGroup($("#allUserList"))
}
