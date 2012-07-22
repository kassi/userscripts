// ==UserScript==
// @name        GC Log
// @description Extension to Geocaching for easier logging.
//              It stores current number of found caches and ftf's.
//              It assists in entering a smart first line to a log,
//              by adding new buttons.
// @author      Karsten Silkenbäumer
// @namespace   de.mystery-caching
// @include http://www.geocaching.com/my/*
// @include http://www.geocaching.com/seek/log.aspx?*
// @include http://www.geocaching.com/seek/nearest.aspx?*
// ==/UserScript==

// Startseite => Caches found auslesen und setzen
var loglevel = 0;

/** @fn log(int level, String text) */
function GKlog(level,text) { if( loglevel >= level ) console.log("GreaseKit GC Log: "+text); }
function GKerror(text) { GKlog(0,text); }

GKlog(1, "startet");

var cachesFound = GM_getValue('cachesFound');
var ftfsFound = GM_getValue('ftfsFound');
var gccodes;
try { gccodes = JSON.parse(GM_getValue('gccodes', {})); } catch(e) { GKlog(0, e); gccodes = {}; }

var idLogBoxTextArea = "ctl00_ContentBody_LogBookPanel1_uxLogInfo";

function insertTextToLogInfo(string)
{
    var l = document.getElementById(idLogBoxTextArea);
    l.value = l.value.substring(0, l.selectionStart) + string + l.value.substring(l.selectionEnd, l.value.length);
    l.foxus();
}
unsafeWindow.insertTextToLogInfo = insertTextToLogInfo;

function insertTagsToLogInfo(start, end)
{
    var l = document.getElementById(idLogBoxTextArea);
    l.value = l.value.substring(0, l.selectionStart) + start + l.value.substring(l.selectionStart, l.selectionEnd) + end + l.value.substring(l.selectionEnd, l.value.length);
    l.focus();
}
// Register insertTagsToLogInfo() globally
unsafeWindow.insertTagsToLogInfo = insertTagsToLogInfo;

if( document.URL == "http://www.geocaching.com/my/" || document.URL == "http://www.geocaching.com/my/default.aspx" )
{
    //GM_log("GM: my");
    try {
        var html = document.getElementById("ctl00_ContentBody_WidgetMiniProfile1_LoggedInPanel").innerHTML;
        //GM_log(html);
        if( html.match(/Caches Found:<\/strong>\s+(?:(\d+),)?(\d+)<br/i) )
        {
            var finds = parseInt(RegExp.$2,10);
            if( RegExp.$1 )
                finds += parseInt(RegExp.$1,10)*1000;
            GKlog(1,"Caches found: " + finds);
            GM_setValue("cachesFound",finds);
        }
        else
        {
            GKlog(1,"no Match");
        }
    }
    catch(e) {
        GKerror(e);
    }
}
else if(document.URL == "http://www.geocaching.com/my/geocaches.aspx" )
{
    GM_log("Search for TFTC and FTF");

    var html = document.body.innerHTML;

    if( html.match(/>\s*TFTC #(\d+) \@ \d\d:\d\d/) )
    {
        GM_log("Found TFTC");

        if( cachesFound == null || RegExp.$1 > cachesFound )
        {
            GKlog(1, "TFTC found: " + RegExp.$1);
            cachesFound = RegExp.$1;
            GM_setValue('cachesFound', cachesFound);
            GKlog(1, "updated cachesFound");
        }
    }
    else
        GM_log("no TFTC match");

    if( html.match(/>\s*TFTC #\d+ \@ \d\d:\d\d, FTF #(\d+)/) )
    {
        GM_log("Found FTF");
        if( ftfsFound == null || RegExp.$1 > ftfsFound )
        {
            GKlog(1, "FTF found: " + RegExp.$1);
            ftfsFound = RegExp.$1;
            GM_setValue('ftfsFound', ftfsFound);
            GKlog(1, "updated cachesFound");
        }

    }
    else
        GKlog(1, "no FTF match");
}
else if(document.URL.search("\/log\.aspx")>=0)
{
    if( document.getElementById("ctl00_ContentBody_LogBookPanel1_ddLogType") )
    {
        extendLogging();
    }
    else
    {
        GKlog(1, "log entered");
        var userSpan = document.getElementById("ctl00_ContentBody_LogBookPanel1_lbLogText");
        if( userSpan )
        {

            if( userSpan.firstChild.innerHTML == "ElMístico" )
            {
                GKlog(1, "userSpan ok");
                var span = document.getElementById("ctl00_ContentBody_LogBookPanel1_LogText");
                if( span )
                {
                    GKlog(1, "log span found.");
                    if( span.innerHTML.match(/^TFTC #(\d+) @ \d\d:\d\d/) )
                    {
                        GKlog(1, "tftc match found: "+RegExp.$1);
                        if( cachesFound == null || RegExp.$1 > cachesFound )
                        {
                            cachesFound = parseInt(RegExp.$1,10);
                            GM_setValue('cachesFound', cachesFound);
                            GKlog(1, "updated cachesFound to " + cachesFound);
                        }
                    }
                    else
                    {
                        GKlog(1, "kein Match auf TFTC in log span");
                    }

                    if( span.innerHTML.match(/, FTF #(\d+)/) )
                    {
                        GKlog(1, "ftf match found: "+RegExp.$1);
                        if( ftfsFound == null || RegExp.$1 > ftfsFound )
                        {
                            ftfsFound = RegExp.$1;
                            GM_setValue('ftfsFound', ftfsFound);
                            GKlog(1, "updated ftfsFound to " + ftfsFound);
                        }
                    }
                    else
                    {
                        GKlog(1, "kein Match auf FTF");
                    }
                }
            }
        }
        else
        {
            GKlog(1, "no user span found :(");
        }
    }
}

function extendLogging()
{
    GKlog(1, "extendLogging()");
    // ctl00_ContentBody_LogBookPanel1_EditLogPanel
    var panel = document.getElementById("ctl00_ContentBody_LogBookPanel1_EditLogPanel");

    var dl = document.evaluate("self::*"+"//dl", panel, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // hinterm dritten dd einfügen

    var dd = document.evaluate("self::*"+"/dd[3]", dl, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    var logbox = document.getElementById(idLogBoxTextArea);
    //$("LogBookPanel1_ddLogType").observe('change',fillCacheCounter);
//  var wpCheckbox = document.getElementById("ctl00_ContentBody_LogBookPanel1_WptSelectCheckBox");
//  if( wpCheckbox )
//  {
//      var dd = wpCheckbox.parentNode.parentNode;
//      var dt = dd.previousSibling.previousSibling;

        var ndd = document.createElement("dd");

        var button = document.createElement("input");
        var nextCachesFound = parseInt(cachesFound)+1;
        button.setAttribute( "type", "button" );
        button.setAttribute( "value", "Insert TFTC #"+nextCachesFound + " @ " );
        button.addEventListener("click", function(event) {
            var select = document.getElementById("ctl00_ContentBody_LogBookPanel1_ddLogType");
            select.selectedIndex = 1;
            var string = "TFTC #" + nextCachesFound + " @ ";
            var logbox = document.getElementById(idLogBoxTextArea);
            logbox.value=string + logbox.value;
            logbox.focus();
        }, false);

        var nextFtf = parseInt(ftfsFound)+1;
        if( isNaN(nextFtf) )
            nextFtf = 1;
        var buttonFtf = document.createElement("input");
        buttonFtf.setAttribute( "type", "button" );
        buttonFtf.setAttribute( "value", "Insert FTF");
        buttonFtf.addEventListener("click", function(event) {
            var string = ", FTF #"+nextFtf+"\n\n[:D][:D][:D] GOLD [:D][:D][:D]\n\n";
            var logbox = document.getElementById(idLogBoxTextArea);
            logbox.value=logbox.value+string;
            logbox.focus();
        }, false);
        ndd.appendChild(button);
        ndd.appendChild(buttonFtf);
        dd.parentNode.insertBefore(ndd,dd);

        var span = document.createElement("span");
        span.innerHTML = "&nbsp;|&nbsp;";
        ndd.appendChild(span);
        var submit = document.evaluate("self::*"+"//p/input[@type='submit']", panel, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        var newSubmit = submit.cloneNode(true);
        ndd.appendChild(newSubmit);
//  }
//  else
//      GM_log("[gclog.user.js] ctl00_ContentBody_LogBookPanel1_WptSelectCheckBox nicht gefunden");

/*
    var table = document.getElementsByTagName("table")[0];
    var tr = table.insertRow(3);
    var td = document.createElement("td");
    tr.appendChild(td);
    var td2 = document.createElement("td");



    td2.appendChild(button);
    td2.appendChild(buttonFtf);
    td2.appendChild(document.createElement("br"));
    tr.appendChild(td2);
*/
    var dtcomments = logbox.parentNode.previousSibling.previousSibling;
    dtcomments.parentNode.removeChild(dtcomments);
    var bbdiv = document.createElement("div");
    bbdiv.id = "GM_BBCodes";

    // Element style
    var bbDivStyle = document.createAttribute("style");
    bbDivStyle.nodeValue = "margin: 5px 0px 5px 0px; border: 1px dotted #999999; padding: 3px; width: 400px; float:left;";
    bbdiv.setAttributeNode(bbDivStyle);

    // Headline
    var bbdivHead = document.createElement("b");
    var bbdivHeadText = document.createTextNode("BB-Codes (click to surround selection)");
    bbdivHead.appendChild(bbdivHeadText);
    bbdiv.appendChild(bbdivHead);
    var bbdivHeadBr = document.createElement("br");
    bbdiv.appendChild(bbdivHeadBr);
    bbdivHeadBr = document.createElement("br");
    bbdiv.appendChild(bbdivHeadBr);

    // Download BB list
    parseBBList(bbdiv);

    // Append child to main content
    logbox.parentNode.insertBefore(bbdiv, logbox);


    // Create new element to insert:
    //
    // <div id="GM_Emoticons">
    // <a href="javascript:alert(\"http://www.geocaching.com/images/icons/icon_smile.gif\")">
    // <img src="http://www.geocaching.com/images/icons/icon_smile.gif" alt="[:)]" style="border:0px" />
    // </a>
    // </div>
    var icondiv = document.createElement("div");

    // Element id
    var iconDivId = document.createAttribute("id");
    iconDivId.nodeValue = "GM_Emoticons";
    icondiv.setAttributeNode(iconDivId);

    // Element style
    var iconDivStyle = document.createAttribute("style");
    iconDivStyle.nodeValue = "margin: 5px 0px 5px 0px; border: 1px dotted #999999; padding: 3px; width: 400px; float:left;";
    icondiv.setAttributeNode(iconDivStyle);

    // Headline
    var icondivHead = document.createElement("b");
    var icondivHeadText = document.createTextNode("Emoticons (click to insert)");
    icondivHead.appendChild(icondivHeadText);
    icondiv.appendChild(icondivHead);
    var icondivHeadBr = document.createElement("br");
    icondiv.appendChild(icondivHeadBr);
    icondivHeadBr = document.createElement("br");
    icondiv.appendChild(icondivHeadBr);

    // Download icon list
    parseIconList(icondiv);

    // Append child to main content
    logbox.parentNode.insertBefore(icondiv, logbox);

    var clearDiv = document.createElement("div");
    clearDiv.setAttribute("style", "clear:left;");
    logbox.parentNode.insertBefore(clearDiv, logbox);
}

// Helper function to parse downloaded bb list
function parseBBList(bbdiv)
{
    var lines = new Array(
        "[b]$[/b]$Bold$font-weight:bold",
        "[i]$[/i]$Italic$font-style:italic",
        "[u]$[/u]$Underline$text-decoration:underline",
        "[code]$[/code]$Code$font-family:Courier",
        "---",
        "[red]$[/red]$Red$color:#ff0000",
        "[green]$[/green]$Green$color:#00ff00",
        "[blue]$[/blue]$Blue$color:#0000ff");

    // Iterate through lines
    for (var i = 0; i < lines.length; i++)
    {
        if (lines[i] == "---")
        {
            var br = document.createElement("br");
            bbdiv.appendChild(br);
        }
        else if (! lines[i] == "")
        {
            // Split entry into parts
            var parts = lines[i].split("$");
            var start = parts[0];
            var end = parts[1];
            var meaning = parts[2];
            var htmlstyle = parts[3];
            // Add link to div
            bbdiv.appendChild(newLink(start, end, meaning, htmlstyle));
        }
    }
}


// Helper function to build icon preview
function newIcon(string, url)
{
    // Link around icon
    var iconA = document.createElement("a");

    // Link URL
    iconA.href="#";
    iconA.addEventListener('click', function(event)
        {
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

// Helper function to build tag button
function newLink(start, end, meaning, htmlstyle)
{
    // Link around meaning
    var bbA = document.createElement("a");

    // Link URL
    var bbAHref = document.createAttribute("href");
    bbAHref.nodeValue = "javascript:insertTagsToLogInfo(\""+start+"\", \""+end+"\")";
    bbA.setAttributeNode(bbAHref);

    // Link format
    var bbHTML = document.createElement("span");

    // Link style
    var bbHTMLStyle = document.createAttribute("style");
    bbHTMLStyle.nodeValue = htmlstyle + ";margin: 0px 2px 0px 2px";
    bbHTML.setAttributeNode(bbHTMLStyle);

    // Link text
    var bbHTMLText = document.createTextNode(meaning);
    bbHTML.appendChild(bbHTMLText);

    // Add link text to link
    bbA.appendChild(bbHTML);

    // Return link object
    return bbA;
}


// Helper function to parse downloaded icon list
function parseIconList(icondiv)
{
    var lines = new Array(
        "[:)]$http://www.geocaching.com/images/icons/icon_smile.gif",
        "[:D]$http://www.geocaching.com/images/icons/icon_smile_big.gif",
        "[8D]$http://www.geocaching.com/images/icons/icon_smile_cool.gif",
        "[:I]$http://www.geocaching.com/images/icons/icon_smile_blush.gif",
        "[:P]$http://www.geocaching.com/images/icons/icon_smile_tongue.gif",
        "[}:)]$http://www.geocaching.com/images/icons/icon_smile_evil.gif",
        "[;)]$http://www.geocaching.com/images/icons/icon_smile_wink.gif",
        "[:o)]$http://www.geocaching.com/images/icons/icon_smile_clown.gif",
        "[B)]$http://www.geocaching.com/images/icons/icon_smile_blackeye.gif",
        "[8]$http://www.geocaching.com/images/icons/icon_smile_8ball.gif",
        "[:(]$http://www.geocaching.com/images/icons/icon_smile_sad.gif",
        "[8)]$http://www.geocaching.com/images/icons/icon_smile_shy.gif",
        "[:O]$http://www.geocaching.com/images/icons/icon_smile_shock.gif",
        "[:(!]$http://www.geocaching.com/images/icons/icon_smile_angry.gif",
        "[xx(]$http://www.geocaching.com/images/icons/icon_smile_dead.gif",
        "[:X]$http://www.geocaching.com/images/icons/icon_smile_kisses.gif",
        "[^]$http://www.geocaching.com/images/icons/icon_smile_approve.gif",
        "[V]$http://www.geocaching.com/images/icons/icon_smile_dissapprove.gif",
        "[?]$http://www.geocaching.com/images/icons/icon_smile_question.gif",
        "---",
        ":angry:$http://img.groundspeak.com/forums/emoticons/signal/mad.gif",
        ":back:$http://img.groundspeak.com/forums/emoticons/signal/back.gif",
        ":bad:$http://img.groundspeak.com/forums/emoticons/signal/bad_boy_a.gif",
        ":cute:$http://img.groundspeak.com/forums/emoticons/signal/cute.gif",
        ":F:$http://img.groundspeak.com/forums/emoticons/signal/smile.gif",
        ":grin:$http://img.groundspeak.com/forums/emoticons/signal/big_smile.gif",
        ":sad:$http://img.groundspeak.com/forums/emoticons/signal/sad.gif",
        ":shocked:$http://img.groundspeak.com/forums/emoticons/signal/shock.gif",
        ":smile:$http://img.groundspeak.com/forums/emoticons/signal/smile.gif",
        ":surprise:$http://img.groundspeak.com/forums/emoticons/signal/surprise.gif",
        ":tired:$http://img.groundspeak.com/forums/emoticons/signal/tired.gif",
        ":tongue:$http://img.groundspeak.com/forums/emoticons/signal/tongue.gif",
        ":yikes:$http://img.groundspeak.com/forums/emoticons/signal/ohh.gif");

        // Iterate through lines
    for (var i = 0; i < lines.length; i++)
    {
        if (lines[i] == "---")
        {
            var br = document.createElement("br");
            icondiv.appendChild(br);
        }
        else if (! lines[i] == "")
        {
            // Split entry into string and image url
            var parts = lines[i].split("$");
            var string = parts[0];
            var url = parts[1];

            // Add icon to div
            icondiv.appendChild(newIcon(string, url));
        }
    }
}
