var socket = io();
$(document).ready(init);
function init() {
    setupTooltipIn($("body"));
    $(window).resize(function () { return setupTooltipIn($("body")); });
    $(".card.hoverer").hover(function () {
        $(this).children().find("[hoverData]").each(function () {
            var hoverer = $(this);
            var data = hoverer.attr("hoverData");
            var text = hoverer.text();
            hoverer.text(data);
            hoverer.attr("hoverData", text);
        });
    });
}
function setupTooltipIn(container) {
    container.find(".card").each(function () {
        var card = $(this);
        var title = $(card.find('.card-title'));
        var message = $(card.find('span'));
        var hasMessage = message.length > 0;
        var overflowTitle = title[0].scrollWidth > Math.ceil(title.innerWidth());
        var overflowMessage = hasMessage && message.innerWidth() > Math.ceil(title.innerWidth());
        var anycard = card;
        anycard.tooltip("dispose");
        if (overflowTitle && !overflowMessage) {
            anycard.tooltip({
                "title": title.text()
            });
        }
        else if (overflowMessage && !overflowTitle) {
            anycard.tooltip({
                "title": message.text()
            });
        }
        else if (overflowMessage && overflowTitle) {
            anycard.tooltip({
                "html": true,
                "title": "<p>" + title.text() + "</p><p class=\"mb-0\">" + message.text() + "</p>"
            });
        }
    });
}
function href(to) {
    document.location.href = to;
}
