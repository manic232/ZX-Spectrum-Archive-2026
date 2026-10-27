/* ======================================================================
   FRAMES.JS - shareable links for a framed site
   Loaded by BOTH kinds of page, and works out which one it is in:

   1. SECTION PAGES (index, about, help, crash-smashes, ultimate-ptg,
      toy-box, ref12, finder) - the pages that hold the iframes.
      Keeps the address bar in step with the content frame, so the URL
      always points at what you are actually looking at:

          zxsa.co.uk/crash-smashes.html#game-jet-set-willy.html

      Copy that, bookmark it, send it to a mate - opening it loads the
      CRASH Smashes section with Jet Set Willy in the content frame.
      The browser tab title follows the content page too, so bookmarks
      get a sensible name.

   2. CONTENT PAGES (game reviews, further reading, etc.)
      a) If the page is opened on its own (from Google, an old bookmark,
         a link on a forum), it reloads itself inside its section, so the
         menus are there. Which section is set on the script tag:

            <script src="zxsa_files/frames.js" data-section="crash-smashes.html"></script>

         Leave data-section off and it goes to the home page.
         Search-engine robots are left alone, so they can still index
         each page on its own.
      b) "Go Back" links: if there is no earlier page in this visit to go
         back to (because you arrived from a shared link) it takes you to
         the section's front page instead of doing nothing.

   Only plain page names like game-alien.html or folders inside zxsa_files
   are accepted after the #, so the address bar can't be used to load
   another website into the frame.
   ====================================================================== */
(function () {

    /* Note that this browser tab has been on the archive, so the 404 page's
       "Click here to return" knows it can go back rather than to Home */
    try { sessionStorage.setItem("zxsaVisited", "1"); } catch (e) { }

    /* Remember our own <script> tag now - currentScript is only set while
       the script is first running */
    var me = document.currentScript;
    if (!me) {
        var all = document.getElementsByTagName("script");
        me = all[all.length - 1];
    }

    /* A page name we are happy to load into the content frame */
    function isSafePath(p) {
        if (!p) return false;
        if (p.indexOf("..") !== -1 || p.indexOf("//") !== -1 || p.indexOf(":") !== -1) return false;
        return /^[A-Za-z0-9_\-.\/%]+\.(html|pdf|txt)(#.*)?$/.test(p) && p.charAt(0) !== "/";
    }

    /* Folder part of a path, e.g. "/docs/" from "/docs/index.html" */
    function folderOf(path) {
        return path.substring(0, path.lastIndexOf("/") + 1);
    }

    var contentFrame = document.querySelector ? document.querySelector("iframe.zxsa-bottom") : null;

    if (contentFrame) {
        sectionPage(contentFrame);
    } else {
        contentPage();
    }

    /* ==================================================================
       1. SECTION PAGE
       ================================================================== */
    function sectionPage(frame) {

        var defaultSrc = frame.getAttribute("src");      /* e.g. crash-smashes_main.html */
        var baseTitle = document.title;
        var folder = folderOf(location.pathname);

        function wantedPage() {
            var h = location.hash.replace(/^#/, "");
            try { h = decodeURI(h); } catch (e) {}
            return isSafePath(h) ? h : "";
        }

        /* What the content frame is showing, relative to this folder.
           Returns null if it can't be read (Chrome blocks this on file://) */
        function framePage() {
            try {
                var l = frame.contentWindow.location;
                if (l.href === "about:blank") return null;
                if (l.pathname.indexOf(folder) !== 0) return null;
                return l.pathname.substring(folder.length) + l.hash;
            } catch (e) {
                return null;
            }
        }

        /* Load the page named after the # in the address */
        function openWanted() {
            var want = wantedPage();
            if (!want || want === framePage()) return;
            try {
                /* replace() = no extra history entry, so Back still leaves
                   the site the way the visitor expects */
                frame.contentWindow.location.replace(want);
            } catch (e) {
                frame.src = want;
            }
        }

        /* After each page loads in the frame, write it into the address bar */
        function syncAddress() {
            var page = framePage();
            if (page === null) return;

            /* Encode the page name only - anything after its own # (e.g. a
               Find a Game search) is already encoded by the browser */
            var cut = page.indexOf("#");
            var safe = cut === -1 ? encodeURI(page) : encodeURI(page.substring(0, cut)) + page.substring(cut);
            var hash = (page === defaultSrc) ? "" : "#" + safe;
            if (location.hash !== hash && window.history && history.replaceState) {
                history.replaceState(history.state, "", location.pathname + location.search + hash);
            }

            try {
                var t = frame.contentWindow.document.title;
                document.title = (hash && t) ? t + " - ZX Spectrum Archive" : baseTitle;
            } catch (e) {}
        }

        if (wantedPage() && wantedPage() !== defaultSrc) openWanted();

        if (frame.addEventListener) {
            frame.addEventListener("load", syncAddress);
        }

        /* Someone edits the # in the address bar, or follows a #link */
        window.addEventListener("hashchange", function () {
            var want = wantedPage();
            if (!want) return;
            if (want !== framePage()) {
                try { frame.contentWindow.location.href = want; } catch (e) { frame.src = want; }
            }
        });
    }

    /* ==================================================================
       2. CONTENT PAGE
       ================================================================== */
    function contentPage() {

        var section = (me && me.getAttribute("data-section")) || "index.html";
        var isRobot = /bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent || "");

        /* ---- a) Opened on its own: reload inside its section ---- */
        if (window.top === window.self) {
            if (isRobot) return;
            var page = location.pathname.substring(location.pathname.lastIndexOf("/") + 1);
            if (!isSafePath(page)) return;
            location.replace(section + "#" + encodeURI(page) + location.hash);
            return;
        }

        /* ---- b) Smarter "Go Back" ---- */
        function sectionFront() {
            try {
                var f = window.parent.document.querySelector("iframe.zxsa-bottom");
                if (f) return f.getAttribute("src");
            } catch (e) {}
            return null;
        }

        /* Is there an earlier page in this frame to go back to?
           The previous page in the frame shows up as document.referrer.
           When the page was the first thing loaded into the frame (a shared
           link), the referrer is the section page itself - nothing to go
           back to inside the site. */
        function hasPageToGoBackTo() {
            var r = document.referrer;
            if (!r) return false;
            try {
                var a = document.createElement("a");
                a.href = r;
                if (a.host !== location.host) return false;
                var topPath = window.top.location.pathname;
                return a.pathname !== topPath;
            } catch (e) {
                return true;            /* Can't tell (file://) - behave as before */
            }
        }

        function hookBackLinks() {
            var links = document.querySelectorAll ? document.querySelectorAll(".back-link a") : [];
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener("click", function (e) {
                    if (hasPageToGoBackTo()) return;        /* Normal history.back() */
                    var front = sectionFront();
                    if (!front) return;
                    e.preventDefault();
                    location.href = front;
                });
            }
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", hookBackLinks);
        } else {
            hookBackLinks();
        }
    }

})();
