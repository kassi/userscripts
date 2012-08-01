// ==UserScript==
// @name        GC Extensions
// @description Adds some enhancements to geocaching.com website.
// @namespace   de.mystery-caching
// @include     http://www.geocaching.com/*
// ==/UserScript==
(function () {
    GM_log("GC Extensions started");

    if (document.URL == "http://www.geocaching.com/my/" || document.URL == "http://www.geocaching.com/my/default.aspx") {
        addMenuItems();
    }
    localizeGeocachingDowntime();
})();

function addMenuItems() {
    insertMenuItem("/pocket/default.aspx", "Your Pocket Queries");
    insertMenuItem("/my/fieldnotes.aspx", "Your Fieldnotes");
}

function insertMenuItem(href, title) {
    var d = document.getElementById("ctl00_ContentBody_MyAccountTabControl1_hlYourAccountDetails")
    if (d) {
        var pq = document.createElement("a");
        pq.href = href
        pq.title = title
        pq.innerText = pq.title
        d.parentNode.insertBefore(pq, d);
        var br = document.createTextNode(" | ")
        d.parentNode.insertBefore(br, d);
    }
}

function localizeGeocachingDowntime() {
    var downTime = document.evaluate("//div[@class='WarningMessage DownTime']/div[2]/p",
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (downTime) {
        var text = downTime.innerText;
        if (text.match(/will be going offline .* on (\w+), (\w+ \d+, \d+) at approximately (\d+)(?:\:(\d+))?(\w\w) (\w+) /)) {
            var daystring = RegExp.$1;
            var datestring = RegExp.$2;
            var hours = RegExp.$3;
            var minutes = RegExp.$4 || "00";
            var ampm = RegExp.$5;
            var tzshort = RegExp.$6;
            var date = Date.parse(datestring + ' ' + hours + ':' + minutes + ':00' + ampm + ' ' + tzshort);
            var down = new Date(date);
            downTime.innerText = text.replace(/\(.*\)/, "("+down.toLocaleString()+")");
        }
    }
}
