var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
$(document).ready(function () {
    $(".timeline").each(function () { setupTimeline($(this)); });
});
function setupTimeline(timeline) {
    var nowTry = timeline.attr("now");
    var mindate = new Date(timeline.attr("min"));
    var maxdate = new Date(timeline.attr("max"));
    var nowdate = nowTry ? new Date(nowTry) : new Date();
    var diffNow = dateDiff(mindate, nowdate);
    var begin = 0;
    var end = dateDiff(mindate, maxdate);
    var now = (diffNow < 0) ? 0 : diffNow;
    var width = now / end;
    timeline.attr("aria-valuenow", now);
    timeline.attr("aria-valuemin", begin);
    timeline.attr("aria-valuemax", end);
    timeline.css("width", "0");
    setTimeout(function () {
        timeline.css("width", (width * 100) + "%");
    }, 100);
    var str = nowTry ? dateString(nowdate, mindate.getFullYear() != maxdate.getFullYear()) : datesString(mindate, maxdate);
    var dateStr = "";
    if (width <= 0)
        dateStr = "Starts in " + daysDiff(nowdate, mindate);
    else if (width < 1)
        dateStr = "Ends in " + daysDiff(nowdate, maxdate);
    else
        dateStr = "Ended " + daysDiff(maxdate, nowdate, true) + " ago";
    var p = document.createElement("span");
    p.innerText = str;
    p.setAttribute("dateInfo", dateStr);
    timeline.parent().append(p);
}
function dateDiff(begin, end) {
    var diff = end.getTime() - begin.getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
}
function daysDiff(begin, end, past) {
    if (past === void 0) { past = false; }
    var num = dateDiff(begin, end) + (past ? 1 : 0);
    if (num == 1)
        return num + " day";
    else
        return num + " days";
}
function datesString(from, to) {
    var sameYear = true;
    return dateString(from, !sameYear) + " - " + dateString(to, !sameYear);
}
function dateString(date, year) {
    var str = (date.getDate()) + " " + months[date.getMonth()];
    if (year)
        return str + " " + date.getFullYear().toString().substr(2, 2);
    else
        return str;
}
