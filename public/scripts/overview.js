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
    var nameValid = new Validator(ModalValidators.atLeast(8), "name");
    var acceptAssignment = new ModalFormValidator("#acceptAssignment", "manageFinal", "doneFinal", true);
    acceptAssignment.addValues(true, getGroupId());
    acceptAssignment.registerField("file", "file id", "#acceptAssignment_title", ModalValues.attr("file"));
    var declineAssignment = new ModalFormValidator("#declineAssignment", "manageFinal", "doneFinal", true);
    declineAssignment.addValues(false, getGroupId());
    declineAssignment.registerField("file", "file id", "#declineAssignment_title", ModalValues.attr("file"));
    var uploadFiles = new ModalFormValidator("#uploadAssignment", "uploadFiles", "fileUplaoded", true);
    uploadFiles.registerField("assignment", "assignment id", "#uploadAssignment_title", ModalValues.attr("assignment"));
    uploadFiles.registerField("name", "handin name", "#handInName", ModalValues.value);
    uploadFiles.registerField("comments", "commnets", "#comments", ModalValues.value);
    uploadFiles.registerField("partners", "partners", "#studentUserList", getSelected);
    uploadFiles.registerField("files", "files", "#uploadedFilesList", getSelected);
    uploadFiles.addValidation(nameValid);
    uploadFiles.addValidation(new Validator(ModalValidators.or(function (s) { return s.length > 0; }, "Either add some comments, or upload and select at least one file!"), "comments", "files"));
});
