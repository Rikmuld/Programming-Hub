$(document).ready(function () {
    var modCreate = new ModalFormValidator("#feedbackModal", "updateFeedback", "feedbacked");
    modCreate.addValues($("#thefile").attr("fileId"), $("#groupData").attr("name"));
    modCreate.registerField("feedback", "feedback", "#feedback", ModalValues.value);
    modCreate.addValidation(new Validator(ModalValidators.atLeast(2), "feedback"));
    modCreate.onSuccess(function () {
        $("#feedbackMessage").text(modCreate.getValue("feedback"));
    });
});
