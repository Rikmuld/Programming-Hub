$(document).ready(function () {
    $(".userResultsGet").click(function () {
        var user = $(this).attr('user');
        var group = $(this).attr('group');
        var hasData = $(".userResultsSet[user='" + user + "']").html().length > 0;
        if (!hasData)
            socket.emit("getUserResults", group, user);
    });
    socket.on("userResultsGot", setUserResults);
});
function setUserResults(html, user) {
    var par = $(".userResultsSet[user='" + user + "']");
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
