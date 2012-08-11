// ==UserScript==
// @name        GetPocket Extensions
// @description Adds some features to getpocket website
// @author      Karsten Silkenbäumer
// @namespace   de.kluks
// @include     http://getpocket.com/*
// ==/UserScript==

/**
 * Access documents jQuery
 * @param {function} j Closure to execute in jQuery scope.
 * @example use_jQuery( function ($) { ... } );
 */
function use_jQuery(j) {
  var script = document.createElement('script');
  //if a page doesn't have jQuery un-comment the src to add it
  //script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js';
  script.type = 'text/javascript';
  //if adding jQuery from src you may need to change (jQuery) to ()
  script.textContent = '(' + j.toString() + ')(jQuery)';
  document.body.appendChild(script);
}

(function () {
  if (document.URL == "http://getpocket.com/a/queue/") {
    openTags();
  }
})();

/** Directly opens the 'tags' section on load */
function openTags() {
  use_jQuery(function ($) {
    $(document).ready(function() {
      $("[title=Tags]").first().click();
    })
  });
}
