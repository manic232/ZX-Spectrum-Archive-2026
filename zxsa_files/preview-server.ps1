$Root = $PSScriptRoot | Split-Path -Parent
$Port = 8791

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

$mime = @{
    ".html" = "text/html"; ".htm" = "text/html"; ".css" = "text/css"
    ".js" = "application/javascript"; ".wasm" = "application/wasm"
    ".json" = "application/json"; ".png" = "image/png"; ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"; ".gif" = "image/gif"; ".ico" = "image/x-icon"
    ".tzx" = "application/octet-stream"; ".tap" = "application/octet-stream"
    ".pok" = "application/octet-stream"; ".szx" = "application/octet-stream"
    ".rom" = "application/octet-stream"; ".dsk" = "application/octet-stream"
    ".z80" = "application/octet-stream"; ".map" = "application/json"
    ".txt" = "text/plain"; ".md" = "text/plain"
}

# The request-handling loop runs on its own background runspace, leaving
# the main thread free to run a small WinForms dialog as the UI instead of
# trying to resize/reposition the console window itself -- that approach
# turned out to be unreliable across different console hosts (e.g. Windows
# Terminal vs. the classic console host), where the window a script can see
# and move isn't always the one actually visible on screen. A dialog we
# build ourselves has no such ambiguity.
$serverScript = {
    param($listener, $mime, $Root)
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
        } catch {
            break  # listener was stopped from the main thread
        }
        $req = $context.Request
        $res = $context.Response
        try {
            $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
            if ($path -eq "/") { $path = "/index.html" }
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root ($path.TrimStart("/"))))
            if (-not $fullPath.StartsWith([System.IO.Path]::GetFullPath($Root))) {
                $res.StatusCode = 403; $res.Close(); continue
            }
            if (Test-Path $fullPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
                $res.ContentType = $ct
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
                $res.OutputStream.Write($buf, 0, $buf.Length)
            }
        } catch {
            $res.StatusCode = 500
        } finally {
            $res.Close()
        }
    }
}

$runspace = [runspacefactory]::CreateRunspace()
$runspace.Open()
$serverPs = [powershell]::Create()
$serverPs.Runspace = $runspace
[void]$serverPs.AddScript($serverScript).AddArgument($listener).AddArgument($mime).AddArgument($Root)
$serverHandle = $serverPs.BeginInvoke()

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Windows stores the user's chosen app theme (Settings > Personalization >
# Colors > "Choose your mode") here -- 1 means light, 0 means dark. Default
# to light if the key's missing for any reason (very old Windows versions).
$isLightMode = $true
try {
    $themeKey = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" -Name "AppsUseLightTheme" -ErrorAction Stop
    $isLightMode = ($themeKey.AppsUseLightTheme -eq 1)
} catch {}

if ($isLightMode) {
    $bgColor = [System.Drawing.Color]::FromArgb(243, 243, 243)
    $fgColor = [System.Drawing.Color]::FromArgb(26, 26, 26)
    $btnBg = [System.Drawing.Color]::FromArgb(225, 225, 225)
} else {
    $bgColor = [System.Drawing.Color]::FromArgb(32, 32, 32)
    $fgColor = [System.Drawing.Color]::White
    $btnBg = [System.Drawing.Color]::FromArgb(50, 50, 50)
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "ZXSA Local Preview"
$form.Size = New-Object System.Drawing.Size(600, 215)
$form.FormBorderStyle = 'FixedToolWindow'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $false
$form.StartPosition = 'Manual'
$form.BackColor = $bgColor

$workArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$form.Location = New-Object System.Drawing.Point(($workArea.Right - $form.Width), ($workArea.Bottom - $form.Height))

$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "Stop Server && Close"
$stopButton.Dock = 'Bottom'
$stopButton.Height = 40
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 13)
$stopButton.BackColor = $btnBg
$stopButton.ForeColor = $fgColor
$stopButton.FlatStyle = 'Flat'
$stopButton.UseVisualStyleBackColor = $false		# Without this, the button partially ignores BackColor/ForeColor even with FlatStyle set, leaving a stray light-coloured edge around it
$stopButton.FlatAppearance.BorderSize = 0			# Was BorderColor = $fgColor, which is white in dark mode -- that drew a literal white border around the whole button. No border at all reads cleaner than picking a "correct" subtle colour.
$stopButton.TabStop = $false						# It's the only control on the form, so it auto-receives keyboard focus on load -- FlatStyle='Flat' buttons draw their own focus-cue rectangle in managed code, which a WM_CHANGEUISTATE/UISF_HIDEFOCUS message (tried first, didn't work) has no effect on. Never letting it take focus at all removes the cue at the source instead of trying to suppress it after the fact.

# Dock='Fill' guarantees the label exactly fills whatever space remains
# above the button, with no risk of a gap regardless of the exact title bar
# height. IMPORTANT: the Fill control must be added to Controls BEFORE the
# Bottom-docked one -- added the other way around first, which visually put
# the button on top of/overlapping the label's own bottom edge instead of
# being excluded from its area.
$urlText = "http://localhost:$Port/"
$labelText = "ZXSA local preview is running.`n`n$urlText"
$label = New-Object System.Windows.Forms.LinkLabel
$label.Text = $labelText
$label.Dock = 'Fill'
$label.TextAlign = 'MiddleCenter'
$label.Font = New-Object System.Drawing.Font("Segoe UI", 15)
$label.ForeColor = $fgColor
$label.BackColor = $bgColor
$label.LinkColor = [System.Drawing.Color]::FromArgb(90, 160, 255)
$label.LinkBehavior = 'HoverUnderline'
$label.LinkArea = New-Object System.Windows.Forms.LinkArea($labelText.IndexOf($urlText), $urlText.Length)
$label.Add_LinkClicked({ try { Start-Process $urlText } catch {} })
$form.Controls.Add($label)
$form.Controls.Add($stopButton)

$stopServer = {
    try { $listener.Stop() } catch {}
    try { $serverPs.Stop() } catch {}
    try { $serverPs.Dispose() } catch {}
    try { $runspace.Close() } catch {}
}
$stopButton.Add_Click({
    $stopServer.Invoke()
    $form.Close()
})
$form.Add_FormClosing({
    $stopServer.Invoke()
})

# Best-effort: hide the console window now that setup has succeeded and the
# dialog above is about to become the visible UI instead. Not guaranteed to
# work on every terminal host (GetConsoleWindow can return a handle that
# doesn't correspond to the actual visible window under some hosts, e.g.
# Windows Terminal) -- if it doesn't, the dialog itself is unaffected either
# way, so this is just a nice-to-have rather than something relied on.
try {
    Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ZxsaConsoleHide {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
    $consoleHwnd = [ZxsaConsoleHide]::GetConsoleWindow()
    if ($consoleHwnd -ne [IntPtr]::Zero) {
        [ZxsaConsoleHide]::ShowWindow($consoleHwnd, 0) | Out-Null  # SW_HIDE
    }
} catch {}

# Dark mode above only colours the form's own controls -- the title bar
# itself is drawn by Windows, not WinForms, so it needs a separate DWM call
# to match (otherwise it'd stay light, looking like a light titlebar glued
# onto a dark window). Requires the form to already have a real window
# handle, hence forcing that via $form.Handle before this runs.
if (-not $isLightMode) {
    try {
        [void]$form.Handle
        Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ZxsaDarkTitlebar {
    [DllImport("dwmapi.dll")]
    public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);
}
"@
        $darkModeOn = 1
        [ZxsaDarkTitlebar]::DwmSetWindowAttribute($form.Handle, 20, [ref]$darkModeOn, 4) | Out-Null
    } catch {}
}

[System.Windows.Forms.Application]::Run($form)
