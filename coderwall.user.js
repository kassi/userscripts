// ==UserScript==
// @name        Coderwall Extensions
// @description Adds some features to coderwall website
// @author      Karsten Silkenbäumer
// @namespace   de.kluks
// @include     http://coderwall.com/*
// ==/UserScript==
(function () {

  if (document.URL == "http://coderwall.com/trending") {
    addProTipSearchAccessKeys();
  }

})();

function addProTipSearchAccessKeys() {
  var result = document.evaluate("//a[@href='/p/t?/search']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (var i = 0; i < result.snapshotLength; i++) {
    var elem = result.snapshotItem(i);
    elem.setAttribute("accesskey", " ");
    elem.appendChild(document.createElement("br"));
    var span = document.createElement("span");
    span.style.fontSize = "60%";
    span.innerHTML = "ctrl + ⌥ + SPACE";
    elem.appendChild(span);
  }

  var search_box = document.getElementById("search");

  if (search_box) {
    search_box.addEventListener("keyup", function (event) {
      close(event, search_box)
    }, false);
  }
}

function close(event, box) {
  var key_code = ('which' in event) ? event.which : event.keyCode;
  if (key_code == 27) {
    box.style.display = "none";
  }
}
