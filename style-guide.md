# ZX Spectrum Archive — Style Guide

A plain-English guide to `style.css` (and the little bit of `mobile-frames.js`
it works with) — what each part does, where to find it, and how to change it
safely. Written for editing in Notepad++: every section below names an exact
line of text you can search for with `Ctrl+F`, since line numbers shift every
time the file is edited.

No CSS knowledge assumed. Terms you might not know are explained the first
time they come up, and there's a glossary at the very end if you forget.

## Contents

- [How This File Is Organised](#how-this-file-is-organised)
- [How Desktop and Mobile Work Together](#how-desktop-and-mobile-work-together)
- [Quick Reference — "I Want To Change…"](#quick-reference--i-want-to-change)
- [Colours and Fonts](#colours-and-fonts)
- [The Content Box (`.page`)](#the-content-box-page)
- [Headings (h1–h4)](#headings-h1h4)
- [Links](#links)
- [Header Images (Main & Further-Reading Pages)](#header-images-main--further-reading-pages)
- [Game Review Pages](#game-review-pages)
- [Floating Images](#floating-images)
- [Section Dividers & Spacing Rhythm](#section-dividers--spacing-rhythm)
- [Footer & Back Link](#footer--back-link)
- [Lists](#lists)
- [The Frame Layout (Desktop)](#the-frame-layout-desktop)
- [Mobile Layout & the Bookmarks Panel](#mobile-layout--the-bookmarks-panel)
- [The "Squashed Image" Bug — How to Spot and Fix It Yourself](#the-squashed-image-bug--how-to-spot-and-fix-it-yourself)
- [Common Gotchas](#common-gotchas)
- [How to Test a Change](#how-to-test-a-change)
- [Glossary](#glossary)

---

## How This File Is Organised

`style.css` has two halves:

1. **Lines 1 to roughly 463** — the *default* rules. No conditions attached;
   these apply everywhere, on every screen size, unless something later
   overrides them.
2. **One big block starting `@media (max-width: 900px) {`** and running to
   the very end of the file — every rule inside only applies on a narrow
   screen. Nothing outside this block ever changes because of screen width.

So almost everything in this file exists as a *pair*: a default rule near the
top, and (if mobile needs something different) a matching override inside the
big block at the bottom. **The two are independent.** Changing the top one
never touches the bottom one, and vice versa. If you want desktop and mobile
to match, you have to edit both.

A handful of rules live outside that block entirely, close to it, gated by a
class name instead of screen width (the bookmarks panel button is the main
example) — see [Mobile Layout & the Bookmarks Panel](#mobile-layout--the-bookmarks-panel)
for why.

---

## How Desktop and Mobile Work Together

The line `@media (max-width: 900px) {` is called a **media query**. It does
not detect "is this a phone" — it only asks *"is the browser window currently
900 pixels wide or less?"* That's it. Nothing about device type, nothing
about touchscreens, just a width check.

This has a nice side effect you may have noticed: **shrinking a desktop
browser window triggers the exact same mobile styling as an actual phone.**
There's no special code for "if phone, do X" anywhere in this file — it's all
"if narrow, do X," and both a resized desktop window and a real phone screen
satisfy that same check. The browser re-checks this condition continuously,
live, for as long as the page is open — drag the window narrower and the
mobile rules apply instantly; drag it back wider and they switch off again,
no reload needed.

The number `900` is the cutoff. It appears in exactly one place —
search for:
```
@media (max-width: 900px)
```
— and everything inside those braces only exists below that width.

---

## Quick Reference — "I Want To Change…"

Search terms are the exact comment text on that line, so `Ctrl+F` lands you
precisely on it.

| I want to change… | Search for | Applies to |
|---|---|---|
| Site-wide background colour | `Sets the entire site background colour` | Everywhere |
| Site-wide text colour | `Sets default text colour` | Everywhere |
| The font used everywhere | `Sets the global font` | Everywhere |
| Base text size | `Sets the font size for all text` | Everywhere |
| Gap around the *screen edge* (outer margin) | `Adds spacing around whole site` | Desktop |
| Same, on mobile | `Trim side margins to gain text width` | Mobile |
| Gap between content and the box *edge* (inner padding) | `Adds inner spacing inside the content box` | Desktop |
| Same, on mobile | `Gap between content and the box edge` | Mobile |
| Rounded corners on the content box | `Slightly rounded corners around content box` | Desktop |
| Heading sizes | `Font size for all main headings` (h1), and similar for h2/h3/h4 | Desktop (shared) |
| Link colour | `White links` | Everywhere |
| Section divider line | `Fading line effect` | Desktop; mobile gap is `Was 80px on desktop` |
| Footer text | `.footer {` | Desktop (shared) |
| "Go Back" link text | `Changes label for back link` | Everywhere |
| Box art size on game pages (mobile) | `Prominent, but not the full width` | Mobile |
| Gap under tape/instructions row (mobile) | `The requested gap before the review text below` | Mobile |
| The floating bookmarks button | `The floating button that opens the panel` | Mobile |
| Desktop background schematic image | `Fallback colour while image loads` | Desktop |

---

## Colours and Fonts

Search for `GLOBAL OPTIONS` near the very top of the file.

```css
body {
    background: #000;    /* page background - pure black */
    color: #fff;          /* default text colour - white */
    font-family: Verdana, Arial, sans-serif;
    font-size: 15px;
}
```

These four lines control the entire site's base look. `#000` and `#fff` are
hex colour codes — `#000` is black, `#fff` is white. If you want to try a
different shade (e.g. a very dark grey instead of pure black), any 6-digit
hex code works, or a name like `darkslategray`.

`font-family` lists fonts in order of preference — the browser uses the
first one it has installed, falling back to the next if not. `sans-serif` at
the end is a safety net that always works.

The content box itself (`.page`) has its own, slightly lighter background —
see the next section.

---

## The Content Box (`.page`)

This is the dark rounded rectangle that holds everything — the "card" the
whole site sits inside. Search for:
```
Sets background colour for the content box
```

```css
.page {
    max-width: 1064px;         /* never wider than this, even on a huge screen */
    padding: 28px;              /* desktop gap between the edge and the content */
    background-color: #111;     /* slightly lighter than the page background */
    border: 1px solid #333;
    border-radius: 10px;        /* rounded corners */
    box-shadow: 0 0 10px #000;  /* soft shadow */
}
```

The **mobile version** of this box has its own padding and a smaller corner
radius — search for `Gap between content and the box edge`, inside the
`@media` block. As covered above, these two `padding` values are completely
separate; there's no automatic link between them.

---

## Headings (h1–h4)

Search for `HEADINGS` (the section banner comment).

The site uses two different "shapes" of page title, and it's worth knowing
which one a given page uses before changing anything here:

- **h1 alone** — a plain page title (e.g. "About The Archive").
- **h3 followed immediately by h4** — a title with a small subtitle directly
  underneath (e.g. "ZX81" / "Sinclair Research, 1981"). h3 and h4 are
  deliberately sized and spaced to look like ONE title block, not two
  separate headings.

```css
h1 { font-size: 26px; margin-bottom: 35px; }
h2 { font-size: 18px; margin-bottom: 10px; }  /* subheadings within a page */
h3 { font-size: 26px; margin-bottom: 5px; }   /* same size as h1, on purpose */
h4 { font-size: 14px; margin-bottom: 38px; }  /* the real "gap before body text" for h3+h4 pages */
```

`margin-bottom` is the gap **below** that heading, before whatever comes
next. Notice h3's own gap (5px) is tiny — that's what holds it tight against
its h4 subtitle. The *real* "gap before the rest of the page" for that title
style is h4's 38px, not h3's 5px. This matters if you ever want to adjust
spacing here — always check whether a page is h1-only or h3+h4 before
assuming which number governs the gap you're looking at.

On mobile, all four headings are centred (search `text-align: center` inside
the `@media` block, right after the comment beginning `Headings read better
centred`). That same mobile rule also includes `clear: both` — if you ever
wonder why that's there, see [Common Gotchas](#common-gotchas).

---

## Links

Search for `LINKS` (section banner).

```css
a:link, a:visited {
    color: #fff;              /* white */
    text-decoration: none;    /* no underline normally */
    font-weight: bold;
}
a:hover {
    text-decoration: underline;  /* underline appears on hover/tap */
}
```

`a.game` (font-size 12px) is specifically for links inside the navigation
frames — changing it affects the sidebar/bookmarks list, not body text
links.

---

## Header Images (Main & Further-Reading Pages)

These are the two images that sit either side of a page's title on the home
page, About, and the further-reading articles (not game review pages — see
[Game Review Pages](#game-review-pages) for those).

Search for `MAIN SITE & FURTHER READING HEADER IMAGES`.

```css
.header-left {   /* the rainbow graphic */
    float: left;
    margin-bottom: 150px;
}
.header-right {   /* the page-specific logo/photo */
    float: right;
    margin-bottom: 30px;
}
```

On mobile, `.header-left` (the rainbow) is hidden entirely — it was decided
this reads as clutter on a small screen — and `.header-right` becomes a
centred block instead of floating. Search `Rainbow hidden on small screens
only` to find that.

---

## Game Review Pages

The header block at the top of every `game-*.html` page — title, tape icon,
instructions icon, box art, and the publisher/price/year table — has its own
dedicated CSS, separate from every other page type. Search for `GAME TITLE &
HEADER INFO TABLE`.

### Desktop layout

Box art floats right at a **fixed 350px height** (search `Box art height`).
Tape and instructions stack vertically on the left (`.game-header-left`),
each with its own caption generated automatically — search `Sets the label
for the tape image` — the actual visible words "Load Game" and
"Instructions" are written directly in the CSS, not the HTML.

### Mobile layout

Search for `Game review pages: box art centre stage`. On a narrow screen the
whole header is rearranged into: **title → info table → box art → tape and
instructions row**, all centred. This reading order doesn't match the order
things appear in the HTML — getting it to *look* reordered without touching
every single game page's HTML uses a CSS trick called `order` (part of
"flexbox" layout). If you want to understand this mechanism in more depth
before touching it, see [Common Gotchas](#common-gotchas) below — this is
the single most fragile part of the whole stylesheet, in the sense that it's
easy to accidentally break something *else* while adjusting it.

Sizes and gaps you can safely tweak directly:
- Box art width: `max-width: 60%` — search `Prominent, but not the full width`
- Gap between tape and instructions: `gap: 25px` — search `Space between the two icons`
- Gap before the review text starts: `margin: 0 0 50px 0` — search `The requested gap before the review text below`

### The info table

The publisher/price/year table doesn't behave like a normal HTML table on
mobile — each row is independently centred rather than sharing column widths
across the whole table (this was a deliberate fix; a plain table centres as
one block but each row still reads left-aligned inside it). Search `each row
centred as its own independent unit` for the full explanation if you're
curious, but there should be no need to touch this section unless something
about the table specifically looks wrong.

---

## Floating Images

Three different, similar-but-distinct classes control images that sit beside
text rather than on their own line — search `FLOATING IMAGES`.

- **`.float-left` / `.float-right`** — the small decorative "GIF elder"
  icons and inline screenshots used throughout the site.
- **`.photo-block-left` / `.photo-block-right`** — a photo *with a caption
  underneath it*, used for game screenshots with a credit line.

```css
.float-left  { float: left;  margin-right: 15px; margin-bottom: 10px; }
.float-right { float: right; margin-left: 10px; }
```

On mobile, both are capped at `max-width: 45%` (search `Leaves a readable
text column`) so there's always room for the text to wrap beside them
without the image dominating the screen.

**If you ever add a brand new image to any of these classes and it looks
squashed or stretched on mobile**, see the dedicated section below — this is
a known, recurring issue with an easy fix once you know what to look for.

---

## Section Dividers & Spacing Rhythm

Search for `SECTION WRAPPERS`. Most long-form pages (interviews, articles)
are broken into chunks, each wrapped in `<div class="section">`, with a
soft fading line automatically drawn between consecutive sections.

```css
.section + .section {
    margin-top: 80px;   /* gap above each new section, desktop */
}
.section + .section::before {
    top: calc(-80px / 2);   /* the divider line sits exactly halfway up that gap */
}
```

**Important:** if you change the `80px` gap, you must change the `-80px / 2`
line to match — the comment right above this rule spells out why. They're
two separate numbers describing the same gap and have to be kept in sync by
hand.

`.section2` is the version used where **no divider** is wanted (game review
text is `.section2`, not `.section`) — same idea, no fading line.

Mobile shrinks all of this — search `Tighten the large desktop vertical
rhythm` near the end of the file for the full set of reduced mobile values
(divider gap, footer gap, back-link gap).

---

## Footer & Back Link

Search for `FOOTER`.

```css
.footer {
    font-size: 12px;
    margin-top: 80px;
    color: #888;   /* mid-grey */
}
.footer-meta::after {
    content: " | Updated Aug 2026";   /* the date shown after the footer text */
}
```

That last line is how the "Updated" date gets onto every page without
editing every page individually — the actual visible text is written here,
in the CSS, not in each HTML file. If you ever update the site and want a
new date to show, this is the one place to change it.

The "Go Back" link works the same way — search `Changes label for back link`:
```css
.back-link a::after {
    content: "Go Back";
}
```

---

## Lists

Search for `LIST STYLES`. Bullet points inside `.section` are drawn with CSS
rather than the browser's default bullet, so they can be styled/positioned
precisely:

```css
.section li::before {
    content: "•";
}
```

Change the `•` to any other character if you want a different bullet style.

---

## The Frame Layout (Desktop)

This is more structural than decorative, so it's riskier to change than
most of the sections above — flagging that up front.

The site's main pages (home, About, Help, etc.) aren't single HTML files —
each is three separate documents stitched together with `<iframe>`s: a
narrow navigation column on the left, a thin top bar, and the main content
underneath. Search for `ZXSA MODERN LAYOUT` for the CSS that arranges this.

```css
.zxsa-wrapper { max-width: 1284px; display: flex; }
.zxsa-frame   { width: 220px; }   /* the left nav column */
.zxsa-main    { width: 1064px; }  /* everything else */
```

The dark schematic image behind the outer edges of the page (visible on a
wide enough screen either side of the content) is set here too — search
`Fallback colour while image loads`.

---

## Mobile Layout & the Bookmarks Panel

On mobile, the three-frame layout above gets restacked into one scrolling
column, and the left navigation frame becomes a slide-out panel triggered by
a floating button, rather than sitting in the page flow. This is the most
JavaScript-dependent part of the whole site — a companion file,
`mobile-frames.js`, does the actual measuring and button-building; `style.css`
just defines what things look like once that script has done its job.

A few classes you'll see referenced repeatedly if you go looking through the
mobile block, and what sets them:

| Class | Set by | Meaning |
|---|---|---|
| `.zxsa-has-panel` | `mobile-frames.js` | The page is narrow enough to have a slide-out panel at all |
| `.zxsa-nav-open` | `mobile-frames.js`, on button tap | The panel is currently open |
| `.zxsa-anim` | `mobile-frames.js`, one frame after load | Turns on the slide *transition* — without this the panel would visibly flash open once before sliding away on every page load |
| `.zxsa-mobile-nav` | `mobile-frames.js` | Put on the nav frame's own `<body>`, so its links can be enlarged for touch |

**Why some of these rules sit outside the `@media` block:** the desktop
version of the left nav frame is only 220px wide, so if these rules were
keyed to screen width, the *desktop* sidebar would also match "narrow screen"
and pick up phone styling by accident. Keying them to a class that
JavaScript controls instead avoids that entirely — search `Gating on the
class alone` for the original reasoning.

The floating button itself — search `The floating button that opens the
panel`:
```css
.zxsa-nav-toggle {
    position: fixed;
    right: 14px;
    bottom: calc(14px + env(safe-area-inset-bottom));
    background-color: #1a1a1a;
    border-radius: 24px;
}
```
`env(safe-area-inset-bottom)` is a way of asking the phone "how much space do
you need for your own home-bar/gesture area at the bottom of the screen?" —
it's 0 on most Android phones and non-zero on notched iPhones, so the button
never sits underneath the home indicator.

---

## The "Squashed Image" Bug — How to Spot and Fix It Yourself

This came up several times while building the mobile layout, and it's worth
understanding in case it ever happens with a new image you add later.

**The cause:** an `<img>` tag with an HTML `height="…"` attribute but **no**
matching `width="…"` attribute. On a wide desktop screen this is invisible —
the browser works out the correct width to match that height automatically.
But mobile width-limits images (`max-width: 100%` — search `Scale down
oversized images`), and when that width cap kicks in, the HTML height
attribute stays fixed while the width shrinks — stretching the image out of
its correct proportions instead of scaling it down cleanly.

**How to check if a new image has this problem:** open the page's HTML file
and look at the `<img>` tag. If it has `height="240"` (any number) and no
`width="…"` at all, it's at risk.

**How to fix it**, once confirmed: add a rule targeting that specific image
by its filename, setting `height: auto` on mobile only. There's already a
list of these — search `Same squash as me.jpg` — just add your new filename
to that same list:
```css
.page img[src*="your-new-image.jpg"] {
    height: auto;
}
```

**Why by filename, and not just fixing the class generally:** some images
(the small "GIF elder" icons) *rely* on their height attribute to render
bigger than their real native size — search `Same squash as me.jpg` for the
full reasoning, right above the list of filenames. Blanket-fixing the whole
class would shrink those back down to their tiny native size, which would
be a regression, not a fix. Targeting by filename guarantees you can only
ever affect the specific image you name.

---

## Common Gotchas

Things that look like a mistake but are either intentional, or explained by
something non-obvious about how CSS/browsers work.

**"I changed a mobile rule and nothing happened, even after refreshing."**
Almost always a caching issue — the browser (especially on a phone) can hold
onto an old copy of `style.css` and not notice a new one is available. Try a
hard refresh, or open the page in a private/incognito window, before
assuming the CSS itself is wrong.

**"The 220px sidebar is picking up mobile phone styling on desktop."**
Every iframe on the page loads the *same* `style.css`, and each one checks
the `@media (max-width: 900px)` condition against **its own width**, not the
whole screen's. The desktop sidebar frame is only 220px wide, so — on its
own — it always matches that "narrow" condition, even on a huge monitor.
Anywhere this matters, the fix is to key the rule to a class instead of
width (see the bookmarks panel section above) rather than relying on the
media query alone.

**"A heading isn't centring properly even though `text-align: center` is
set on it."** Check whether a floated image sits directly before it and
hasn't been "cleared." If the image is still floating when the heading
starts, the heading's first line only has the *narrowed* space beside the
float to centre within — not the full page width — so it looks visibly
off-centre despite the rule being correctly applied. The fix is `clear:
both` on the heading, which drops it below the float first. This exact
scenario already exists in the file (search `clear:both matters here`); if
you spot a *new* instance of this same visual symptom elsewhere, that's what
to check for first.

**"I unfloated an image and something else on the page changed too, even
though I didn't touch it."** If the fix involves turning a *container* (like
`.section`) into a flex layout rather than just changing the image itself,
**every direct child of that container** becomes a "flex item" — and floats
have no effect at all on flex items, full stop. If that container has some
*other*, unrelated floated image inside it (e.g. a screenshot meant to sit
beside a paragraph), that image would silently stop floating too, purely by
being a sibling in the same now-flex container, even though nothing about
it was directly touched. This is exactly why the icon-centring fix near
`clear:both matters here` (see above) deliberately avoids making the whole
section flex, and only changes the one image directly — search `unlike the
icon+heading work reverted earlier` for where the comment notes an earlier
attempt *did* take the whole-section-flex approach and had to be undone.
The lesson: before making a container flex to fix one specific child, check
what *else* lives inside that same container first.

**"The floating bookmarks button jumps around slightly in Firefox on
Android, but not Chrome."** Known, low-priority, deliberately left alone —
a quirk in how Firefox handles its address bar hiding while scrolling,
versus a `position: fixed` element. Chrome doesn't have the same issue.
Not worth chasing further for how rarely Firefox is used on mobile.

---

## How to Test a Change

1. Save `style.css`.
2. View the site with either:
   - **Repo Sync O-MATIC's "Preview on phone" button**, on your phone or in
     a desktop browser, or
   - A normal desktop browser window, resized narrower than 900px wide (see
     [How Desktop and Mobile Work Together](#how-desktop-and-mobile-work-together) —
     this is a genuinely accurate stand-in for a phone, not just a rough
     approximation).
3. If a change doesn't seem to have taken effect, hard-refresh or try a
   private/incognito window before assuming something's wrong with the CSS
   itself (see [Common Gotchas](#common-gotchas)).
4. Always check **both** the narrow view and the normal desktop view after
   a change — it's easy for something meant to be mobile-only to accidentally
   sit outside the `@media` block, or vice versa.

---

## Glossary

**Class** — a label given to one or more HTML elements (e.g.
`class="float-left"`), which CSS can then target with a rule starting with a
dot, e.g. `.float-left { ... }`.

**Selector** — the part of a CSS rule before the `{ }`, describing *which*
elements the rule applies to. `.page img` means "any `<img>` inside
something with class `page`."

**Specificity** — when two rules both try to set the same property on the
same element, the more *specific* selector wins, roughly regardless of which
one appears later in the file. `.page img` beats plain `img` because it's a
more specific description. This is why some rules in this file are prefixed
with `.page` even though it looks redundant — it's there specifically to win
against a more general rule elsewhere.

**Margin vs padding** — margin is the gap *outside* a box, between it and
whatever's next to it. Padding is the gap *inside* a box, between its edge
and its own content. Easy to mix up; this file has hit that exact confusion
before.

**Float** — makes an element (usually an image) sit to one side, with text
free to wrap around it. A long-standing CSS technique, mostly superseded by
flexbox/grid for new layouts, but used throughout this site for exactly the
"image with text wrapping beside it" look.

**Clear** — forces an element to drop below any floated element before it,
instead of sitting beside it. See the heading gotcha above for why this
matters more than it might seem.

**Flexbox (`display: flex`)** — a more modern, more powerful layout system
than floats. Used in this file mainly to *reorder* things visually without
changing the actual HTML — see the game review page section.

**Media query** — a conditional block of CSS, `@media (condition) { ... }`,
that only applies when the condition is true. This site uses exactly one:
screen width of 900px or less.

**Pseudo-element (`::before` / `::after`)** — lets CSS insert content (like
the "Load Game" caption, or the section divider line) without it existing in
the HTML at all. Search `content:` to find every place this site does this.

**`:has()`** — a relatively modern CSS feature that lets a rule check
whether an element *contains* something matching another selector, before
deciding whether to apply. Used throughout the mobile section to target very
specific situations (e.g. "a float immediately followed by a heading")
without touching anything else that superficially looks similar.

**Viewport** — the visible area of the browser window. "Viewport width" is
what the `900px` in the media query actually measures.
