$(document).ready(() => {
    const modCreate = new ModalFormValidator("#addCourse", "createCourse", "courseCreated")
    modCreate.registerField("name", "course name", "#courseName", ModalValues.value)
    modCreate.registerField("start", "start date", "#courseStart", ModalValues.date)
    modCreate.registerField("end", "end date", "#courseEnd", ModalValues.date)

    modCreate.addValidation(new Validator(ModalValidators.atLeast(8), "name"))
    modCreate.addValidation(new Validator(ModalValidators.exists(), "start"))
    modCreate.addValidation(new Validator(ModalValidators.exists(), "end"))
    modCreate.addValidation(new Validator(ModalValidators.dateOrder(), "start", "end"))

    const modUpdate = new ModalFormValidator("#updateCourse", "updateCourse", "courseUpdated")
    modUpdate.registerField("course", "course id", "#update_courseName", ModalValues.attr("course"))
    modUpdate.copyFrom(modCreate, "update_")
    modUpdate.onOpen((mod) => {
        const name = mod.getJq("name")

        const start = name.attr("start")
        const end = name.attr("end")

        const startPar = mod.getJq("start").parent() as any
        startPar.datepicker('setDate', new Date(start))
        
        const endPar = mod.getJq("end").parent() as any
        endPar.datepicker('setDate', new Date(end))
    })

    const modDelete = new ModalFormValidator("#removeCourse", "removeCourse", "courseRemoved")
    modDelete.registerField("course", "course id", "#removeCourseName", ModalValues.attr("course"))

    $(".courseCard").hover(function() {
        const card = $(this)
        const info = card.find(".progress span")
        const currInfo = info.text()
        const newInfo = info.attr("dateInfo")
        
        info.text(newInfo)
        info.attr("dateInfo", currInfo)
    })
})