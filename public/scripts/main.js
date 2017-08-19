const socket = io();
$(document).ready(init);
function init() {
    setupTooltipIn($("body"));
    $(window).resize(() => {
        const anycard = $(".card");
        anycard.tooltip("dispose");
        setupTooltipIn($("body"));
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
