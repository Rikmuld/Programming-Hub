var socket = io();
let zone;
let project;
Dropzone.options.zonemini = {
    createImageThumbnails: false,
    parallelUploads: 5,
    accept: function (file, done) {
        if (!isPython(file)) {
            this.removeFile(file);
            $('#errMessage').show();
            done();
        }
        else {
            done();
        }
    },
    init: function () {
        zone = this;
        this.on("addedfile", function (file) {
            if (isPython(file))
                $('#errMessage').hide();
            else {
                this.removeFile(file);
                $('#errMessage').show();
            }
        });
    },
    success: function (file, response) {
        zone.removeFile(file);
        addResult(file.name, response);
        $('#testResults').show();
        //let name = (data.children.item(1) as HTMLDivElement).children.item(1) as HTMLDivElement
        //name.appendChild(document.createElement("br"))
        //let result = document.createElement("span")
        //if (!response.success) {
        //    result.classList.add("error")
        //    result.innerText = response.err
        //} else result.innerText = "Passed " + response.passed + "/" + response.tests + "!"
        //name.appendChild(result)
    }
};
function removeResults() {
    $('#completedTests').html("");
    $('#testResults').hide();
}
function addResult(name, response) {
    if (response.success) {
        const el = document.createElement("tr");
        function addDataOf(typ, data, to) {
            const column = document.createElement(typ);
            column.innerText = data;
            to.appendChild(column);
        }
        addDataOf("td", name, el);
        addDataOf("td", response.tests.toString(), el);
        addDataOf("td", response.passed.toString(), el);
        const sel = document.createElement("select");
        sel.classList.add("form-control");
        sel.id = "failedTests";
        response.failed.forEach((val) => addDataOf("option", val, sel));
        const td = document.createElement("td");
        td.appendChild(sel);
        el.appendChild(td);
        $('#completedTests').append(el);
    }
}
function isPython(file) {
    return file.name.split(".").pop() == "py";
}
$('#clearAllFiles').click(function () {
    removeResults();
});
$(document).ready(function () {
    socket.emit('getMiniprojects');
    $('#switchProject').click(stopGrade);
});
socket.on('setMiniprojects', setMiniprojects);
function setMiniprojects(data) {
    if (data.success) {
        $("#miniprojects").html(data.html);
    }
    else {
        $("#miniprojects").html(data.err);
    }
}
function gradeProject(id, name) {
    project = id;
    $("#mpname").text("'" + name + "' ");
    $("#miniprojects").fadeOut(100, () => $("#upload").fadeIn(100));
}
function stopGrade() {
    project = "";
    $("#upload").fadeOut(100, () => $("#miniprojects").fadeIn(100, () => removeResults()));
}
//# sourceMappingURL=main.js.map