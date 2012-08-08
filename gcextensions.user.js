// ==UserScript==
// @name        GC Extensions
// @description Adds some enhancements to geocaching.com website.
// @namespace   de.mystery-caching
// @include     http://www.geocaching.com/*
// ==/UserScript==
(function () {
	GM_log("GC Extensions started");

	if (document.URL.substr(0,29) == "http://www.geocaching.com/my/") {
		addMenuItems();
	}
	if (document.URL == "http://www.geocaching.com/my/geocaches.aspx") {
		tweakCalendar();
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

function tweakCalendar() {
  var origin = new Date(2000,0,1);
  function getVOfDate(date) {
  	var diff = Math.round((date.getTime()-origin.getTime()) / (60*60*24*1000));
  	return diff;
  }
  function getDateOfV(v) {
    var date = new Date( origin.getTime() + (60*60*24*1000*v));
    return date;
  }
  function onSelectClick(event) {
    var v = this.options[this.selectedIndex].value;
    var script = document.createElement("script");
    script.innerHTML = "__doPostBack('ctl00$ContentBody$MyCalendar','" + v + "');"
    document.body.appendChild(script);
  }
  var calendar = document.getElementById("ctl00_ContentBody_MyCalendar");
  var now = new Date();
  var headTable = calendar.rows[0].cells[0].firstChild;
  var dateCell = headTable.rows[0].cells[1];
  var nextHref = headTable.rows[0].cells[2].firstChild.getAttribute("href");
  var nextMonthV = nextHref.match(/'V(\d+)'/)[1];
  var thisMonthV = nextMonthV-1;
  var thisMonth = getDateOfV(thisMonthV);
  var yearSelect = document.createElement("select");
  var monthSelect = document.createElement("select");

  for (var y = 2000; y < now.getFullYear()+2; y++) {
    var option = document.createElement("option");
    var date = new Date(y, thisMonth.getMonth(), 1);
    option.value = getVOfDate(date);
    option.innerText = ""+y;
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
