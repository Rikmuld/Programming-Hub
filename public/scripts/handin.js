$(document).ready(() => {
    const modCreate = new ModalFormValidator("#feedbackModal", "updateFeedback", "feedbacked");
    modCreate.addValues($("#thefile").attr("fileId"));
    modCreate.registerField("feedback", "feedback", "#feedback", ModalValues.value);
});
