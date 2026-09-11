/* ======================================================================
   MOBILE FRAME SIZING AND BOOKMARKS PANEL
   Loaded only by the wrapper pages (index, about, help, crash-smashes,
   ref12, toy-box, ultimate-ptg).

   Two jobs, both only on screens up to 900px wide:

   1. FRAME SIZING. style.css stacks the frames into a single column and
      gives each a viewport-relative fallback height, which makes each
      frame scroll internally. This script measures the real content
      height of the top bar and the main content frame and publishes it as
      a --fit-h custom property, so those frames grow to fit their content
      and the PAGE does the scrolling instead - much nicer on touch.

      Why a custom property rather than an inline height? --fit-h is only
      ever READ inside the @media (max-width: 900px) block in style.css,
      so a measurement taken at phone width is simply ignored on a desktop
      screen. Setting an inline height would instead leave the desktop
      layout depending on this script cleaning up after itself.

   2. BOOKMARKS PANEL. The navigation frame holds 28 bookmark links. Left
      in the stacked column it sits below all the main content, miles down
      the page, with links sized for a mouse. So this script adds a
      floating button and a backdrop, and style.css turns that frame into
      a slide-out panel. It also tags the frame's own <body> with
      .zxsa-mobile-nav so the links inside can be enlarged into proper tap
      targets - keyed to that class rather than to width, because the
      220px desktop sidebar also matches the mobile media query.

   Degrades safely: if the frames cannot be measured (Chrome blocks
   reading iframe contents on file:// URLs, where every file counts as its
   own origin) the CSS fallback heights stay in place. If JavaScript does
   not run at all, no button is built and .zxsa-has-panel is never added,
   so the bookmarks simply remain listed at the foot of the page.
   ====================================================================== */
(function () {

    var BREAKPOINT = 900;               /* Must match the @media rule in style.css */
    var LABEL_CLOSE = "✕ Close";        /* Multiplication X glyph */
    var LABEL_FALLBACK = "Menu";        /* Used if the frame heading cannot be read */

    /* The button label is taken from the panel's own heading, because the left
       frame differs per section: Bookmarks on index/about/help, Reviews on
       crash-smashes / toy-box / ultimate-ptg, Retail on ref12. */
    var navLabel = LABEL_FALLBACK;

    /* The nav frame becomes a full-height panel, so it is deliberately NOT
       height-fitted - only these two are */
    var FIT_SELECTOR = ".zxsa-top, .zxsa-bottom";
    var NAV_SELECTOR = ".zxsa-frame";

    var toggle = null;
    var backdrop = null;

    function isNarrow() {
        return window.innerWidth <= BREAKPOINT;
    }

    /* ---------- frame height fitting ---------- */

    /* Height for a frame holding a document that sizes itself to the viewport
       rather than to its content: as much of the screen as is left once the top
       navigation bar has taken its share, so the content is visible without
       scrolling. */
    function viewportFitHeight() {
        var top = document.querySelector(".zxsa-top");
        var used = top ? Math.ceil(top.getBoundingClientRect().height) : 0;
        return Math.max(240, window.innerHeight - used);
    }

    function fitFrame(frame) {
        var doc;

        try {
            doc = frame.contentDocument;
        } catch (e) {
            return false;               /* Cross-origin or file:// restriction */
        }

        if (!doc || !doc.body || !doc.documentElement) {
            return false;               /* Not loaded yet */
        }

        /* Measure with the frame temporarily made TALLER, for two reasons.

           A content-sized document (<html> is height:auto, so it wraps its own
           content) ignores the extra room, and its measured height is the true
           content height. A document that sizes itself to the viewport instead
           grows to fill whatever room it is given - imageviewer.html sets
           html,body { height: 100% } and centres the image - and measuring one
           of those is circular: it always reports exactly the frame's current
           height, so whatever height the frame happened to have gets locked in.
           That is why tapping box art left the image centred far down a frame
           still sized for the game page behind it. The probe tells the two
           cases apart.

           Growing the frame is specifically the safe direction: shrinking it
           shortens the page, which makes the browser clamp the scroll position
           to the top. That is what used to make Firefox jump to the top while
           scrolling, so nothing here may ever shrink the frame to measure it.
           Both writes happen in one task with only a layout read between them,
           so nothing is painted mid-probe and there is no flicker. */
        var base = Math.ceil(frame.getBoundingClientRect().height);
        var probeA = base + 1000;
        var probeB = base + 2000;

        frame.style.setProperty("--fit-h", probeA + "px");
        var heightA = Math.ceil(doc.documentElement.getBoundingClientRect().height);

        frame.style.setProperty("--fit-h", probeB + "px");
        var heightB = Math.ceil(doc.documentElement.getBoundingClientRect().height);

        var height;

        if (heightB > heightA + 2) {
            /* The document grew when the frame did, so it sizes itself to the
               viewport. Content-fitting is meaningless here, so give it a frame
               that fits the screen, less the top bar above it. */
            height = viewportFitHeight();
        } else {
            /* Height did not follow the frame, so it is a true content height.
               Two probes are needed rather than one: comparing a single
               measurement against the probe misreads any page whose content is
               taller than the probe, which happened to a long page loaded into a
               frame left short by the image viewer. */
            height = heightA;
        }

        if (!height) {                  /* Belt and braces for odd documents */
            height = Math.max(
                doc.body.scrollHeight,
                doc.documentElement.scrollHeight
            );
        }

        if (!height) {
            frame.style.removeProperty("--fit-h");   /* Fall back to stylesheet */
            return false;
        }

        /* Write only on an actual change, so repeat measurements cost no layout */
        var next = height + "px";
        if (frame.style.getPropertyValue("--fit-h") !== next) {
            frame.style.setProperty("--fit-h", next);
        }
        return true;
    }

    function fitAll() {
        var frames = document.querySelectorAll(FIT_SELECTOR);
        var i;

        for (i = 0; i < frames.length; i++) {
            if (isNarrow()) {
                fitFrame(frames[i]);
            }
            /* No else branch: above the breakpoint the stylesheet never
               reads --fit-h, so any stale value is already inert */
        }
    }

    /* Content can grow after load as images decode, so re-measure whenever
       the inner document changes size */
    function watchFrame(frame) {
        if (typeof ResizeObserver !== "function") {
            return;
        }

        try {
            var body = frame.contentDocument.body;
            if (!body) return;

            new ResizeObserver(function () {
                if (isNarrow()) fitFrame(frame);
            }).observe(body);
        } catch (e) {
            /* Not measurable - the CSS fallback covers it */
        }
    }

    /* ---------- bookmarks panel ---------- */

    function isOpen() {
        return document.body.className.indexOf("zxsa-nav-open") !== -1;
    }

    function setOpen(open) {
        var cls = document.body.className.replace(/\s*zxsa-nav-open\s*/g, " ");
        document.body.className = open ? (cls + " zxsa-nav-open") : cls;

        if (toggle) {
            toggle.innerHTML = open ? LABEL_CLOSE : ("☰ " + navLabel);
            toggle.setAttribute("aria-label", open ? "Hide " + navLabel : "Show " + navLabel);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        }
    }

    /* Read the panel's own heading - the frames mark it up as a 20px span -
       so the button says "Bookmarks", "Reviews" or "Retail" as appropriate */
    function readNavLabel(frame) {
        try {
            var doc = frame.contentDocument;
            if (!doc) return LABEL_FALLBACK;

            var spans = doc.getElementsByTagName("span");
            for (var i = 0; i < spans.length; i++) {
                if (spans[i].style && spans[i].style.fontSize === "20px") {
                    var text = (spans[i].textContent || "").replace(/^\s+|\s+$/g, "");
                    if (text) return text;
                }
            }
        } catch (e) {
            /* Unreadable on file:// - fall back below */
        }
        return LABEL_FALLBACK;
    }

    /* Enlarge the links inside the nav frame into tap targets, and close the
       panel when one is followed so it is not left hanging open */
    function prepareNavFrame(frame) {
        try {
            var doc = frame.contentDocument;
            if (!doc || !doc.body) return;

            if (doc.body.className.indexOf("zxsa-mobile-nav") === -1) {
                doc.body.className += " zxsa-mobile-nav";
            }

            /* Now the frame is readable, label the button from its heading */
            navLabel = readNavLabel(frame);
            if (!isOpen()) setOpen(false);      /* Repaints the label */

            if (!doc.body.getAttribute("data-zxsa-bound")) {
                doc.body.setAttribute("data-zxsa-bound", "1");
                doc.addEventListener("click", function (e) {
                    var el = e.target;
                    while (el && el.tagName !== "A") { el = el.parentNode; }
                    if (el) setOpen(false);
                });
            }
        } catch (e) {
            /* Not reachable on file:// - links stay mouse-sized */
        }
    }

    function unprepareNavFrame(frame) {
        try {
            var doc = frame.contentDocument;
            if (!doc || !doc.body) return;
            doc.body.className = doc.body.className
                .replace(/\s*zxsa-mobile-nav\s*/g, " ");
        } catch (e) { /* ignore */ }
    }

    function buildPanel() {
        if (toggle) return;

        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "zxsa-nav-toggle";
        toggle.innerHTML = "☰ " + navLabel;
        toggle.setAttribute("aria-label", "Show " + navLabel);
        toggle.setAttribute("aria-expanded", "false");
        toggle.onclick = function () { setOpen(!isOpen()); };

        backdrop = document.createElement("div");
        backdrop.className = "zxsa-nav-backdrop";
        backdrop.onclick = function () { setOpen(false); };

        document.body.appendChild(backdrop);
        document.body.appendChild(toggle);

        /* Escape closes the panel, for anyone on a keyboard */
        document.addEventListener("keydown", function (e) {
            if (e.keyCode === 27 && isOpen()) setOpen(false);
        });
    }

    /* Add or remove the class that switches the frame into a panel, so that
       resizing across the breakpoint behaves correctly */
    function syncPanelMode() {
        var nav = document.querySelector(NAV_SELECTOR);
        var has = document.body.className.indexOf("zxsa-has-panel") !== -1;

        if (isNarrow()) {
            buildPanel();

            if (!has) {
                document.body.className += " zxsa-has-panel";

                /* Enable the slide transition only on the NEXT frame, once the
                   panel is already sitting off-screen. Otherwise it would
                   animate out from its stacked position on every page load. */
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(function () {
                        window.requestAnimationFrame(function () {
                            if (document.body.className.indexOf("zxsa-anim") === -1) {
                                document.body.className += " zxsa-anim";
                            }
                        });
                    });
                } else {
                    document.body.className += " zxsa-anim";
                }
            }

            if (nav) prepareNavFrame(nav);
        } else {
            if (has) {
                document.body.className = document.body.className
                    .replace(/\s*zxsa-has-panel\s*/g, " ")
                    .replace(/\s*zxsa-anim\s*/g, " ");
            }
            setOpen(false);
            if (nav) unprepareNavFrame(nav);
        }
    }

    /* ---------- wiring ---------- */

    function bind() {
        var frames = document.querySelectorAll(FIT_SELECTOR);
        var nav = document.querySelector(NAV_SELECTOR);
        var i;

        for (i = 0; i < frames.length; i++) {
            /* Frames reload when a nav link targets them, so re-fit on load */
            frames[i].addEventListener("load", function () {
                if (isNarrow()) fitFrame(this);
                watchFrame(this);

                /* On a narrow screen the PAGE scrolls rather than the frame, and
                   a page keeps its scroll position when an iframe inside it
                   navigates. So following a link from half way down left the
                   reader half way down the new document instead of at its start.
                   Desktop never showed this: there the frame scrolls internally
                   and resets itself on navigation.

                   Only the content frame, and never its first load, so a browser
                   restoring the scroll position on refresh is left alone. */
                if (this === document.querySelector(".zxsa-bottom")) {
                    if (this.getAttribute("data-zxsa-loaded") && isNarrow()) {
                        window.scrollTo(0, 0);
                    }
                    this.setAttribute("data-zxsa-loaded", "1");
                }
            });

            if (isNarrow()) fitFrame(frames[i]);
            watchFrame(frames[i]);
        }

        if (nav) {
            nav.addEventListener("load", function () {
                if (isNarrow()) prepareNavFrame(this);
            });
        }

        syncPanelMode();
    }

    /* Re-run on viewport changes. The expensive measuring pass is throttled to
       one run per frame paint, but syncPanelMode runs immediately: it only
       toggles classes, and those classes decide whether the desktop sidebar
       gets phone styling, so it must not depend on a frame being painted
       (requestAnimationFrame does not fire in a tab that is not rendering). */
    var pending = null;
    var lastWidth = window.innerWidth;

    function schedule() {
        var width = window.innerWidth;
        var widthChanged = (width !== lastWidth);
        lastWidth = width;

        syncPanelMode();

        /* A height-only resize is the mobile browser's own toolbar sliding in
           or out as you scroll. Firefox for Android fires resize for that on
           practically every scroll, so re-measuring there is wasted work that
           only interferes with scrolling. Layout depends on width, not height,
           so ignore those events entirely. */
        if (!widthChanged) return;

        if (pending !== null) return;
        pending = window.requestAnimationFrame ?
            window.requestAnimationFrame(function () { pending = null; fitAll(); }) :
            window.setTimeout(function () { pending = null; fitAll(); }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    } else {
        bind();
    }

    window.addEventListener("load", function () { fitAll(); syncPanelMode(); });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

})();
