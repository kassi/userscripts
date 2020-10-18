/* global $: true */
// ==UserScript==
// @name        GC Extensions
// @version     2.1
// @description Extension to Geocaching for easier logging.
//              It stores current number of found caches and ftf's.
//              It assists in entering a smart first line to a log
//              or smileys by adding new buttons.
//              It adds export of fieldnotes to be imported for other users.
// @author      Karsten Silkenbäumer
// @namespace   https://www.kluks.de/
// @match       https://www.geocaching.com/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @require     https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

(function geocachingExtensions () {
  'use strict';

  const ftfCounterKey = "ftfsFound";
  const lastLogKey = "lastLog";
  const idLogBoxTextArea = "LogText";

  if (document.URL.substr(0, 29) == "https://www.geocaching.com/my/") {
  }
  if (document.URL == "https://www.geocaching.com/my/geocaches.aspx") {
    tweakCalendar();
  }
  if (document.URL == "https://www.geocaching.com/account/drafts") {
    waitForKeyElements(".btn-delete", addFieldnoteExport);
  }
  if (document.URL.match(/:\/\/www.geocaching.com\/play\/geocache\/\w+\/log/)) {
    waitForKeyElements("#logContent", addLogEnhancements);
  }
  localizeGeocachingDowntime();

  function tweakCalendar() {
    var origin = new Date(2000, 0, 1);

    function getVOfDate(date) {
      var diff = Math.round((date.getTime() - origin.getTime()) / (60 * 60 * 24 * 1000));
      return diff;
    }

    function getDateOfV(v) {
      var date = new Date(origin.getTime() + (60 * 60 * 24 * 1000 * v));
      return date;
    }

    function onSelectClick(event) {
      var v = this.options[this.selectedIndex].value;
      var script = document.createElement("script");
      script.innerHTML = "__doPostBack('ctl00$ContentBody$MyCalendar','V" + v + "');"
      document.body.appendChild(script);
    }
    var calendar = document.getElementById("ctl00_ContentBody_MyCalendar");
    var now = new Date();
    var headTable = calendar.rows[0].cells[0].firstChild;
    var dateCell = headTable.rows[0].cells[1];
    var nextHref = headTable.rows[0].cells[2].firstChild.getAttribute("href");
    var nextMonthV = nextHref.match(/'V(\d+)'/)[1];
    var thisMonthV = nextMonthV - 1;
    var thisMonth = getDateOfV(thisMonthV);
    var yearSelect = document.createElement("select");
    var monthSelect = document.createElement("select");

    for (var y = 2000; y < now.getFullYear() + 2; y++) {
      var option = document.createElement("option");
      var date = new Date(y, thisMonth.getMonth(), 1);
      option.value = getVOfDate(date);
      option.innerText = "" + y;
      if (y == thisMonth.getFullYear()) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
    for (var m = 0; m < 12; m++) {
      var option = document.createElement("option");
      var date = new Date(thisMonth.getFullYear(), m, 1);
      option.value = getVOfDate(date);
      option.innerText = date.toLocaleDateString().match(/[^\s\d]{3,}/)[0];
      if (m == thisMonth.getMonth()) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    }

    yearSelect.onchange = onSelectClick;
    monthSelect.onchange = onSelectClick;

    dateCell.innerText = "";
    dateCell.appendChild(yearSelect);
    dateCell.appendChild(monthSelect);
  }

  function localizeGeocachingDowntime() {
    var downTime = document.evaluate("//div[@class='WarningMessage DownTime']/div[2]/p", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (downTime) {
      var text = downTime.innerText;
      if (text.match(/will be offline .* on (\w+), (\w+ \d+)(?:\w\w)?(, \d+) at approximately (\d+)(?:\:(\d+))?(\w\w) (\w+) /)) {
        var daystring = RegExp.$1;
        var datestring = RegExp.$2 + RegExp.$3;
        var hours = RegExp.$4;
        var minutes = RegExp.$5 || "00";
        var ampm = RegExp.$6;
        var tzshort = RegExp.$7;
        var date = Date.parse(datestring + ' ' + hours + ':' + minutes + ':00' + ampm + ' ' + tzshort);
        var down = new Date(date);
        downTime.innerText = text.replace(/\(.*\)/, "(" + down.toLocaleString() + ")");
      }
    }
  }

  var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (text, fileName) {
      var charCode, byteArray = [];
      byteArray.push(255, 254);
      for (var i = 0; i < text.length; ++i) {
        charCode = text.charCodeAt(i);
        byteArray.push(charCode & 0xFF);
        byteArray.push((charCode & 0xFF00) >>> 8);
      }
      console.log(byteArray);
      var blob = new Blob([new Uint8Array(byteArray)], { type: "text/plain;charset=utf16-le," }),
        url = window.URL.createObjectURL(blob);
      console.log(blob);
      console.log(url);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  }());

  function addFieldnoteExport(node) {
    var deleteAllButton = $(node)[0],
      exportAllButton = document.createElement("button");
    exportAllButton.type = "button";
    exportAllButton.style = "float: right; margin-right: 10px;";
    exportAllButton.innerHTML = "Export all";
    $(exportAllButton).click(function (event) {
      var drafts = document.evaluate("//div[@class='draft-content']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var text = "";
      for (var i = 0; i < drafts.snapshotLength; i++) {
        var draftContent = drafts.snapshotItem(i);
        console.log(draftContent);
        var a = draftContent.children[0];
        var href = a.href;
        var found = href.match(/gc=(.*?)&/);
        var date = document.evaluate(".//span[@class='date']", a, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText;
        var time = document.evaluate(".//span[@class='timestamp']", a, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText;
        var datetime = new Date(Date.parse(date + " " + time + " GMT"));
        text += found[1] + "," + datetime.toISOString().replace(".000", "") + "," + "Found it:,\"\"\r\n";
      }
      saveData(text, "fieldnotes.txt");
    });
    deleteAllButton.parentNode.appendChild(exportAllButton);
    return false;
  }

  function addLogEnhancements() {
    function addTftcButtons() {
      function addButton(text, handler) {
        var btn = document.createElement("input");
        btn.setAttribute("type", "text");
        btn.setAttribute("readonly", "readonly");
        btn.value = text;
        btn.style.marginRight = "10px";
        btn.style.width = "22%";
        btn.onclick = handler;
        return btn;
      }
      var div = document.createElement("div");

      var reportProblem = document.getElementById("reportProblemInfo");
      logContent.insertBefore(div, reportProblem);

      var tftcButton = addButton("Insert TFTC #" + getNextCacheCounter(), insertTftc);
      var ftfButton = addButton("Insert FTF #" + getNextFTFCounter(), insertFTF);
      var textButton = addButton("Insert Last Log", insertLastLog);

      div.appendChild(tftcButton);
      div.appendChild(ftfButton);
      div.appendChild(textButton);
    }

    function addSmileySection() {
      function toggleSmileySection(event) {
        var $target = $(event.target);
        var $div = $target.siblings("div");
        console.log(event.target);
        console.log($div[0]);
        console.log($target.data("open"));
        if ($target.data("open")) {
          console.log("close");
          $div.hide();
          $target.data("open", false);
        } else {
          // close
          console.log("open");
          $div.show();
          $target.data("open", true);
        }
      }

      function newIcon(string, url) {
        // Link around icon
        var iconA = document.createElement("a");

        // Link URL
        iconA.href = "#";
        iconA.addEventListener('click', function (event) {
          event.preventDefault();
          insertTextToLogInfo(string);
        }, true);

        // Image
        var iconImg = document.createElement("img");

        // Image URL
        var iconImgSrc = document.createAttribute("src");
        iconImgSrc.nodeValue = url;
        iconImg.setAttributeNode(iconImgSrc);

        // Image Text
        var iconImgAlt = document.createAttribute("alt");
        iconImgAlt.nodeValue = string;
        iconImg.setAttributeNode(iconImgAlt);
        var iconImgTitle = document.createAttribute("title");
        iconImgTitle.nodeValue = string;
        iconImg.setAttributeNode(iconImgTitle);

        // Image Style
        var iconImgStyle = document.createAttribute("style");
        iconImgStyle.nodeValue = "border:0px; margin: 0px 2px 0px 2px";
        iconImg.setAttributeNode(iconImgStyle);

        // Add image to link
        iconA.appendChild(iconImg);

        // Return object
        return iconA;
      }

      function addSmileys(icondiv) {
        var lines = new Array(
          "[:)]$https://www.geocaching.com/images/icons/icon_smile.gif",
          "[:D]$https://www.geocaching.com/images/icons/icon_smile_big.gif",
          "[8D]$https://www.geocaching.com/images/icons/icon_smile_cool.gif",
          "[:I]$https://www.geocaching.com/images/icons/icon_smile_blush.gif",
          "[:P]$https://www.geocaching.com/images/icons/icon_smile_tongue.gif",
          "[}:)]$https://www.geocaching.com/images/icons/icon_smile_evil.gif",
          "[:O]$https://www.geocaching.com/images/icons/icon_smile_shock.gif",
          "[;)]$https://www.geocaching.com/images/icons/icon_smile_wink.gif",
          "[:o)]$https://www.geocaching.com/images/icons/icon_smile_clown.gif",
          "[B)]$https://www.geocaching.com/images/icons/icon_smile_blackeye.gif",
          "[8]$https://www.geocaching.com/images/icons/icon_smile_8ball.gif",
          "[:(]$https://www.geocaching.com/images/icons/icon_smile_sad.gif",
          "[8)]$https://www.geocaching.com/images/icons/icon_smile_shy.gif",
          "[:(!]$https://www.geocaching.com/images/icons/icon_smile_angry.gif",
          "[xx(]$https://www.geocaching.com/images/icons/icon_smile_dead.gif",
          "[|)]$https://www.geocaching.com/images/icons/icon_smile_sleepy.gif",
          "[:X]$https://www.geocaching.com/images/icons/icon_smile_kisses.gif",
          "[^]$https://www.geocaching.com/images/icons/icon_smile_approve.gif",
          "[V]$https://www.geocaching.com/images/icons/icon_smile_dissapprove.gif",
          "[?]$https://www.geocaching.com/images/icons/icon_smile_question.gif",
          "---", ":angry:$https://www.geocaching.com/images/icons/mad.gif",
          ":back:$https://www.geocaching.com/images/icons/back.gif",
          ":bad:$https://www.geocaching.com/images/icons/bad_boy_a.gif",
          ":cute:$https://www.geocaching.com/images/icons/cute.gif",
          ":F:$https://www.geocaching.com/images/icons/smile.gif",
          ":grin:$https://www.geocaching.com/images/icons/big_smile.gif",
          ":sad:$https://www.geocaching.com/images/icons/sad.gif",
          ":shocked:$https://www.geocaching.com/images/icons/shock.gif",
          ":smile:$https://www.geocaching.com/images/icons/smile.gif",
          ":surprise:$https://www.geocaching.com/images/icons/surprise.gif",
          ":tired:$https://www.geocaching.com/images/icons/tired.gif",
          ":tongue:$https://www.geocaching.com/images/icons/tongue.gif",
          ":yikes:$https://www.geocaching.com/images/icons/ohh.gif");

        // Iterate through lines
        for (var i = 0; i < lines.length; i++) {
          if (lines[i] == "---") {
            var br = document.createElement("br");
            icondiv.appendChild(br);
          }
          else if (!lines[i] == "") {
            // Split entry into string and image url
            var parts = lines[i].split("$");
            var string = parts[0];
            var url = parts[1];

            // Add icon to div
            icondiv.appendChild(newIcon(string, url));
          }
        }
      }

      var logView = $(".log-view")[0];
      var logContentWrapper = $(".log-content-wrapper")[0];

      var section = document.createElement("section");
      section.className = "region trackables-wrapper";
      section.id = "insertPanel";
      section.style.marginTop = "10px";
      section.style.marginBottom = "42px";
      logView.insertBefore(section, logContentWrapper);

      var div = document.createElement("div");
      section.appendChild(div);

      var button = document.createElement("button");
      button.className = "btn btn-handle handle-open";
      button.type = "button";
      button.setAttribute("data-open", "false");
      button.innerText = "Smileys ";
      button.onclick = toggleSmileySection;
      div.appendChild(button);
      var svg = document.createElement("svg");
      svg.style.width = "24px";
      svg.style.height = "24px";
      svg.setAttribute("height", "24");
      svg.setAttribute("width", "24");
      svg.className = "icon icon-svg-fill sea";
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "/play/app/ui-icons/sprites/global.svg#icon-expand-svg-fill");
      svg.appendChild(use);
      button.appendChild(svg);


      var smileyDiv = document.createElement("div");
      smileyDiv.className = "inventory-panel";
      div.appendChild(smileyDiv);
      var contentDiv = document.createElement("div");
      contentDiv.className = "inventory-content";
      smileyDiv.appendChild(contentDiv);
      addSmileys(contentDiv);
    }

    addTftcButtons();
    addSmileySection();
  }

  function getNextCacheCounter() {
    var countText = $(".cache-count").text();
    var count = countText.match(/[\d,]+/)[0].replace(/\D/g, "");
    return parseInt(count, 10) + 1;
  }

  function getNextFTFCounter() {
    var count = GM_getValue(ftfCounterKey);
    return parseInt(count, 10) + 1;
  }

  function insertTftc(event) {
    event.preventDefault();
    var string = "TFTC #" + getNextCacheCounter() + " @ ";
    var logbox = document.getElementById("LogText");
    logbox.value = string + logbox.value;
    logbox.focus();
    logbox.setSelectionRange(logbox.value.length, logbox.value.length);
  }

  function insertFTF(event) {
    event.preventDefault();
    var string = ", FTF #" + getNextFTFCounter() + "\n\n[:D][:D][:D] GOLD [:D][:D][:D]\n\n";
    var logbox = document.getElementById("LogText");
    var startPos = logbox.value.indexOf("\n");
    if (startPos == -1) {
      logbox.value = logbox.value + string;
    } else {
      logbox.value = logbox.value.substring(0, startPos) + string + logbox.value.substr(startPos);
    }
    logbox.focus();
    logbox.setSelectionRange(logbox.value.length, logbox.value.length);
  }

  function insertTextToLogInfo(string) {
    var l = document.getElementById(idLogBoxTextArea);
    var end = l.selectionEnd;
    l.value = l.value.substring(0, l.selectionStart) + string + l.value.substring(l.selectionEnd, l.value.length);
    l.focus();
    l.selectionStart = l.selectionEnd = end + string.length;
  }
  unsafeWindow.insertTextToLogInfo = insertTextToLogInfo;

})();
