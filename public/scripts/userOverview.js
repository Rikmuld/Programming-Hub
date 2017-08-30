$(document).ready(() => {
    $(".userResultsGet").click(function () {
        const user = $(this).attr('user');
        const group = $(this).attr('group');
        const hasData = $(".userResultsSet[user='" + user + "']").html().length > 0;
        if (!hasData)
            socket.emit("getUserResults", group, user);
    });
    socket.on("userResultsGot", setUserResults);
});
function setUserResults(html, user) {
    const par = $(".userResultsSet[user='" + user + "']");
    par.html(html);
    par.find(".timeline").each(function () {
        setupTimeline($(this));
    });
    setupTooltipIn(par);
    par.find(".card.hoverer").hover(function () {
        $(this).children().find("[hoverData]").each(function () {
            const hoverer = $(this);
            const data = hoverer.attr("hoverData");
            const text = hoverer.text();
            hoverer.text(data);
            hoverer.attr("hoverData", text);
        });
    });
}
