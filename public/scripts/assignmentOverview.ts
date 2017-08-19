$(document).ready(() => {
    $(".assignmentResultsGet").click(function() {
        const assignment = $(this).attr('assignment')
        const group = $(this).attr('group')
        const hasData = $(".assignmentResultsSet[assignment='" + assignment + "']").html().length > 0

        if(!hasData) socket.emit("getAssignmentResults", group, assignment)
    })

    socket.on("assignmentResultsGot", setAssignmentResults)
})

function setAssignmentResults(html: string, assignment: string) {
    const par = $(".assignmentResultsSet[assignment='" + assignment + "']")
    par.html(html)
    par.find(".timeline").each(function() {
        setupTimeline($(this))
    })
    setupTooltipIn(par)
}