$(".collapse-button").click(function () {
    var container = $(this).parent().parent();
    setTimeout(function () {
        setupTooltipIn(container);
    }, 20);
});
