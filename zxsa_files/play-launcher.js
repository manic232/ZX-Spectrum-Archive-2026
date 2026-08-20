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
        + (machine === '128' ? '' : '&48k=Y');

    // window.open has no "centre" option -- left/top have to be computed by
    // hand, positioned relative to the current browser window (not the raw
    // screen), so the popup opens near where you're already looking rather
    // than jumping to screen-centre on a different monitor.
    var popupWidth = 814, popupHeight = 815;
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
