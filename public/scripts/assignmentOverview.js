$(document).ready(function () {
    $(".assignmentResultsGet").click(function () {
        var assignment = $(this).attr('assignment');
        var group = $(this).attr('group');
        var hasData = $(".assignmentResultsSet[assignment='" + assignment + "']").html().length > 0;
        if (!hasData)
            socket.emit("getAssignmentResults", group, assignment);
    });
    socket.on("assignmentResultsGot", setAssignmentResults);
});
function setAssignmentResults(html, assignment) {
    var par = $(".assignmentResultsSet[assignment='" + assignment + "']");
    par.html(html);
    par.find(".timeline").each(function () {
        setupTimeline($(this));
    });
    setupTooltipIn(par);
    par.find(".card.hoverer").hover(function () {
        $(this).children().find("[hoverData]").each(function () {
            var hoverer = $(this);
            var data = hoverer.attr("hoverData");
            var text = hoverer.text();
            hoverer.text(data);
            hoverer.attr("hoverData", text);
        });
    });
}
