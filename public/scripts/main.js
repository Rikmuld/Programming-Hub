const socket = io();
$(document).ready(init);
function init() {
    setupTooltipIn($("body"));
    $(window).resize(() => setupTooltipIn($("body")));
    $(".card.hoverer").hover(function () {
        $(this).children().find("[hoverData]").each(function () {
            const hoverer = $(this);
            const data = hoverer.attr("hoverData");
            const text = hoverer.text();
            hoverer.text(data);
            hoverer.attr("hoverData", text);
        });
    });
}
function setupTooltipIn(container) {
    container.find(".card").each(function () {
        const card = $(this);
        const title = $(card.find('.card-title'));
        const message = $(card.find('span'));
        const hasMessage = message.length > 0;
        const overflowTitle = title[0].scrollWidth > Math.ceil(title.innerWidth());
        const overflowMessage = hasMessage && message.innerWidth() > Math.ceil(title.innerWidth());
        const anycard = card;
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
                "title": `<p>${title.text()}</p><p class="mb-0">${message.text()}</p>`
            });
        }
    });
}
function href(to) {
    document.location.href = to;
}
