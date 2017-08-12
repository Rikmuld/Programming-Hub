$(document).ready(() => {
    $(".userResultsGet").click(function() {
        const user = $(this).attr('user')
        const group = $(this).attr('group')
        const hasData = $(".userResultsSet[user='" + user + "']").html().length > 0

        if(!hasData) socket.emit("getUserResults", group, user)

        console.log(user, group, hasData)
    })

    socket.on("userResultsGot", setUserResults)
})

function setUserResults(html: string, user: string) {
    $(".userResultsSet[user='" + user + "']").html(html)

    //setup timeline, only those unset so far
}