$(document).ready(function () {
    $(".selectTrigger").change(function () { selectClicked($(this)); });
});
function selectClicked(select) {
    var data = select.val();
    var container = select.attr("container");
    $(container).find(".selectActor").each(function () {
        var actorId = $(this).attr("data");
        if (actorId == data)
            $(this).removeClass("hidden");
        else
            $(this).addClass("hidden");
    });
}
