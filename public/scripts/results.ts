$(".collapse-button").click(function() {
    const container = $(this).parent().parent()
    setTimeout(() => {
        setupTooltipIn(container)
    }, 20)
})