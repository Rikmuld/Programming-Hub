$(document).ready(function () {
    $(".btn-card").hover(function () { cardHover($(this), true); }, function () { cardHover($(this), false); });
});
function cardHover(card, hover) {
    var parent = card.parent().parent().parent().parent().get(0);
    var text = hover ? card.attr("data") : "";
    parent.lastChild.firstChild.textContent = text;
}
