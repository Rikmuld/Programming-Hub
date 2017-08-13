$(document).ready(() => {
    $(".userResultsGet").click(function() {
        const user = $(this).attr('user')
        const group = $(this).attr('group')
        const hasData = $(".userResultsSet[user='" + user + "']").html().length > 0

        if(!hasData) socket.emit("getUserResults", group, user)
    })

    socket.on("userResultsGot", setUserResults)
})

function setUserResults(html: string, user: string) {
    const par = $(".userResultsSet[user='" + user + "']")
    par.html(html)
    par.find(".timeline").each(function() {
        setupTimeline($(this))
    })
}