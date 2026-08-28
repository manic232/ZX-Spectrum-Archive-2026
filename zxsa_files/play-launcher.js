// Opens a ROM in the RAZE in-browser emulator via a popup window.
// romUrl: relative path to the .tzx/.tap file (e.g. "zxsa_files/roms/alien.tzx")
// title: game title, shown in the popup window title bar
// machine: optional, pass '128' to boot as a 128K Spectrum instead of the default 48K
//          (most games are 48K; some only run correctly on a 128 though)
function playGameRaze(romUrl, title, machine) {
    var playerUrl = 'zxsa_files/emulator/index.html'
        + '?tape=' + encodeURIComponent(romUrl)
        + '&title=' + encodeURIComponent(title || '')
        + '&webgl=N' // 2D canvas is more reliable than WebGL across browsers (e.g. Brave's shields)
        + '&dither=Y' // Smooths the scaled-up Spectrum display instead of showing hard pixel edges
        + '&border=32' // Bigger, more authentic border than RAZE's tiny 5,4 default -- confirmed pixel-perfect against the matching 960px #stage/#controls width in emulator/raze.css
        + '&cursorKeys=1' // Kempston. Explicit param instead of relying on the <select>'s markup default -- RAZE remembers the player's last choice in localStorage and checks that BEFORE the markup default, so without this, switching control schemes on one game silently carries over and overrides the intended default on every other game afterwards
        + (machine === '128' ? '' : '&48k=Y');

    // window.open has no "centre" option -- left/top have to be computed by
    // hand, positioned relative to the current browser window (not the raw
    // screen), so the popup opens near where you're already looking rather
    // than jumping to screen-centre on a different monitor.
    // Sized to fit the wider 960px stage the border=32 above produces.
    var popupWidth = 980, popupHeight = 988;
    var left = Math.max(0, Math.round(window.screenX + (window.outerWidth - popupWidth) / 2));
    var top = Math.max(0, Math.round(window.screenY + (window.outerHeight - popupHeight) / 2));

    window.open(
        playerUrl,
        'raze_player',
        'width=' + popupWidth + ',height=' + popupHeight + ',left=' + left + ',top=' + top
        + ',resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    return false;
}

// Loads a .dsk floppy image via RAZE's plus3/disk= support, instead of just
// downloading the file like these game pages did before. Passing disk=
// alone is enough to auto-select +3 mode -- raze.js's onDocumentLoad checks
// urlParams.has("disk") as one of its machine-selection conditions, so no
// separate &plus3=Y is needed. Deliberately no &48k= or &tape= here: 48k=Y
// would force 48K mode (which has no disk drive at all, breaking this
// entirely), and if both &tape= and &disk= were ever present tape always
// wins in raze.js's own if/else, silently ignoring the disk.
// romUrl: relative path to the .dsk file. title: game title.
function playGameRazeDisk(romUrl, title) {
    var playerUrl = 'zxsa_files/emulator/index.html'
        + '?disk=' + encodeURIComponent(romUrl)
        + '&title=' + encodeURIComponent(title || '')
        + '&webgl=N'
        + '&dither=Y'
        + '&border=32'
        + '&cursorKeys=1'; // Kempston -- see playGameRaze() for why this must be explicit rather than relying on the markup default

    var popupWidth = 980, popupHeight = 988;
    var left = Math.max(0, Math.round(window.screenX + (window.outerWidth - popupWidth) / 2));
    var top = Math.max(0, Math.round(window.screenY + (window.outerHeight - popupHeight) / 2));

    window.open(
        playerUrl,
        'raze_player',
        'width=' + popupWidth + ',height=' + popupHeight + ',left=' + left + ',top=' + top
        + ',resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    return false;
}

// Loads a standalone .rom image (or a real .z80 snapshot) via RAZE's
// snapshot= support. Per the dev: ROMs are loaded the same way as Z80
// snapshots, and detected by a heuristic (file is exactly 8k or 16k and
// starts with byte 0xF3, the Z80 DI instruction) -- there's no separate
// romUrl-specific param, and a ROM always boots as a 48K system regardless
// of any machine-mode param, so none is passed here. romUrl: relative path
// to the .rom/.z80 file. title: game title.
function playGameRazeRom(romUrl, title) {
    var playerUrl = 'zxsa_files/emulator/index.html'
        + '?snapshot=' + encodeURIComponent(romUrl)
        + '&title=' + encodeURIComponent(title || '')
        + '&webgl=N'
        + '&dither=Y'
        + '&border=32'
        + '&cursorKeys=1'; // Kempston -- see playGameRaze() for why this must be explicit rather than relying on the markup default

    var popupWidth = 980, popupHeight = 988;
    var left = Math.max(0, Math.round(window.screenX + (window.outerWidth - popupWidth) / 2));
    var top = Math.max(0, Math.round(window.screenY + (window.outerHeight - popupHeight) / 2));

    window.open(
        playerUrl,
        'raze_player',
        'width=' + popupWidth + ',height=' + popupHeight + ',left=' + left + ',top=' + top
        + ',resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    return false;
}
