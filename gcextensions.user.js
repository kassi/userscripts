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
