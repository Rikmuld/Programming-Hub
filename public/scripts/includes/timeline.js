var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
$(document).ready(() => {
    $(".timeline").each(function () { setupTimeline($(this)); });
});
function setupTimeline(timeline) {
    const nowTry = timeline.attr("now");
    const mindate = new Date(timeline.attr("min"));
    const maxdate = new Date(timeline.attr("max"));
    const nowdate = nowTry ? new Date(nowTry) : new Date();
    const diffNow = dateDiff(mindate, nowdate);
    const begin = 0;
    const end = dateDiff(mindate, maxdate);
    const now = (diffNow < 0) ? 0 : diffNow;
    const width = now / end;
    timeline.attr("aria-valuenow", now);
    timeline.attr("aria-valuemin", begin);
    timeline.attr("aria-valuemax", end);
    timeline.css("width", "0");
    setTimeout(() => {
        timeline.css("width", (width * 100) + "%");
    }, 100);
    const str = nowTry ? dateString(nowdate, mindate.getFullYear() != maxdate.getFullYear()) : datesString(mindate, maxdate);
    let dateStr = "";
    if (width <= 0)
        dateStr = "Starts in " + daysDiff(nowdate, mindate);
    else if (width < 1)
        dateStr = "Ends in " + daysDiff(nowdate, maxdate);
    else
        dateStr = "Ended " + daysDiff(maxdate, nowdate, true) + " ago";
    const p = document.createElement("span");
    p.innerText = str;
    p.setAttribute("dateInfo", dateStr);
    timeline.parent().append(p);
}
function dateDiff(begin, end) {
    const diff = end.getTime() - begin.getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
}
function daysDiff(begin, end, past = false) {
    const num = dateDiff(begin, end) + (past ? 1 : 0);
    if (num == 1)
        return num + " day";
    else
        return num + " days";
}
function datesString(from, to) {
    const sameYear = true;
    return dateString(from, !sameYear) + " - " + dateString(to, !sameYear);
}
function dateString(date, year) {
    const str = (date.getDate()) + " " + months[date.getMonth()];
    if (year)
        return str + " " + date.getFullYear().toString().substr(2, 2);
    else
        return str;
}
