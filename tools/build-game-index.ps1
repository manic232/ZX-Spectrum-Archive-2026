# ============================================================================
# BUILD GAME INDEX
# ============================================================================
# Reads every game review page listed in the three section menus
#   crash-smashes_frame.html, ultimate-ptg_frame.html, toy-box_frame.html
# and writes docs\zxsa_files\games.js - the list that powers the
# Find a Game page (finder_main.html) and the Random Game link.
#
# RUN IT whenever you add a game, or change a game's title, publisher, year
# or score. Easiest way: double-click build-game-index.bat in this folder.
#
# What it picks up from each game page:
#   Title      - the <h1> heading
#   Publisher  - the "Publisher:" row of the header info table
#   Year       - the "Year:" row
#   Score      - the "Overall:" row of the score table (left blank if none)
#
# Games that only appear on the secret Amulet Found! page (ref12_frame.html)
# are deliberately NOT included, so search and Random never give away the
# hidden clearing.
#
# Works in Windows PowerShell 5.1 (built into Windows) and PowerShell 7.
# ============================================================================

$ErrorActionPreference = 'Stop'

# The docs folder sits next to this tools folder
$docs = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs'
if (-not (Test-Path (Join-Path $docs 'crash-smashes_frame.html'))) {
    # Also allow the script to live inside docs\..\ or be run from docs
    $docs = (Get-Location).Path
}
$outFile = Join-Path (Join-Path $docs 'zxsa_files') 'games.js'

# ----------------------------------------------------------------------------
# PUBLISHER TIDY-UP
# The game pages spell some publishers several ways ("Gremlin" / "Gremlin
# Graphics", "US Gold" / "U.S. Gold" / "US Gold Ltd"). For the Publisher
# dropdown these are merged into one name. The game pages themselves are
# never changed. Add a line here if a new spelling turns up.
# ----------------------------------------------------------------------------
$publisherAliases = @{
    'Beyond Software'               = 'Beyond'
    'Code Masters'                  = 'CodeMasters'
    'Elite Systems'                 = 'Elite'
    'Gargoyle'                      = 'Gargoyle Games'
    'Gremlin'                       = 'Gremlin Graphics'
    'Hewson'                        = 'Hewson Consultants'
    'Hewson Consultants Ltd'        = 'Hewson Consultants'
    'Hi-Tec Software'               = 'Hi-Tec'
    'Imagine Software'              = 'Imagine'
    'Imagine Software Ltd'          = 'Imagine'
    'Incentive Software'            = 'Incentive'
    'Level 9 Computing'             = 'Level 9'
    'Level 9 Computing Ltd'         = 'Level 9'
    'MC Lothlorie'                  = 'Lothlorien'
    'Mikro-Gen Ltd'                 = 'Mikro-Gen'
    'Mikrogen'                      = 'Mikro-Gen'
    'Ouicksliva'                    = 'Quicksilva'
    'P.S.S.'                        = 'PSS'
    'Palace Software'               = 'Palace'
    'Psion Sinclair'                = 'Psion/Sinclair'
    'Realtime Games Software Ltd'   = 'Realtime'
    'System 3 Software Ltd'         = 'System 3'
    'U.S. Gold'                     = 'US Gold'
    'US Gold Ltd'                   = 'US Gold'
    'Virgin Games'                  = 'Virgin'
}

# The three section menus, and the short code each one gets in games.js
$sections = [ordered]@{
    'crash'    = 'crash-smashes_frame.html'
    'ultimate' = 'ultimate-ptg_frame.html'
    'toybox'   = 'toy-box_frame.html'
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Page([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

# Strip tags, decode &amp; etc., collapse whitespace
function Get-PlainText([string]$html) {
    $t = [regex]::Replace($html, '<[^>]+>', '')
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    return ([regex]::Replace($t, '\s+', ' ')).Trim()
}

# Value of a "Label:" row in a two-column info table (first match only)
function Get-Row([string]$html, [string]$label) {
    $pattern = '(?is)<tr>\s*<td>\s*<b>\s*' + [regex]::Escape($label) + ':?\s*</b>\s*</td>\s*<td>(.*?)</td>'
    $m = [regex]::Match($html, $pattern)
    if ($m.Success) { return (Get-PlainText $m.Groups[1].Value) }
    return ''
}

# Turn "95%", "97", "9", "7/10" into a 0-100 number for sorting
function Get-ScoreNumber([string]$score) {
    $m = [regex]::Match($score, '(\d+(?:\.\d+)?)')
    if (-not $m.Success) { return -1 }
    $n = [double]$m.Groups[1].Value
    if ($score -match '/\s*10' -or $n -le 10) { $n = $n * 10 }
    return [math]::Round($n)
}

# How the score is shown in the results table
function Get-ScoreLabel([string]$score) {
    if ($score -eq '') { return '' }
    if ($score -match '%') { return $score }
    if ($score -match '/') { return ($score -replace '\s', '') }
    $m = [regex]::Match($score, '^\d+$')
    if ($m.Success) {
        if ([int]$score -le 10) { return "$score/10" }
        return "$score%"
    }
    return $score
}

# Escape a string for a JavaScript "..." literal
function ConvertTo-JsString([string]$s) {
    $s = $s.Replace('\', '\\').Replace('"', '\"')
    $s = [regex]::Replace($s, '[\x00-\x1f]', ' ')
    return '"' + $s + '"'
}

# ---- Collect which games are in which section ----
$gameSections = [ordered]@{}
foreach ($code in $sections.Keys) {
    $framePath = Join-Path $docs $sections[$code]
    $frame = Read-Page $framePath
    foreach ($m in [regex]::Matches($frame, 'href="(game-[^"#?]+\.html)"')) {
        $file = $m.Groups[1].Value
        if (-not $gameSections.Contains($file)) { $gameSections[$file] = New-Object System.Collections.ArrayList }
        if (-not $gameSections[$file].Contains($code)) { [void]$gameSections[$file].Add($code) }
    }
}

# ---- Read each game page ----
$lines = New-Object System.Collections.ArrayList
$warnings = New-Object System.Collections.ArrayList
foreach ($file in $gameSections.Keys) {
    $path = Join-Path $docs $file
    if (-not (Test-Path $path)) {
        [void]$warnings.Add("Missing page (listed in a menu but not found): $file")
        continue
    }
    $html = Read-Page $path

    $m = [regex]::Match($html, '(?is)<h1[^>]*>(.*?)</h1>')
    $title = ''
    if ($m.Success) { $title = Get-PlainText $m.Groups[1].Value }
    if ($title -eq '') { $title = $file; [void]$warnings.Add("No <h1> title: $file") }

    $publisher = Get-Row $html 'Publisher'
    if ($publisherAliases.ContainsKey($publisher)) { $publisher = $publisherAliases[$publisher] }
    $year  = Get-Row $html 'Year'
    $score = Get-Row $html 'Overall'

    $secList = ($gameSections[$file] | ForEach-Object { ConvertTo-JsString $_ }) -join ','
    $line = '{' +
        '"f":' + (ConvertTo-JsString $file) +
        ',"t":' + (ConvertTo-JsString $title) +
        ',"p":' + (ConvertTo-JsString $publisher) +
        ',"y":' + (ConvertTo-JsString $year) +
        ',"s":' + (ConvertTo-JsString (Get-ScoreLabel $score)) +
        ',"n":' + (Get-ScoreNumber $score) +
        ',"c":[' + $secList + ']}'
    [void]$lines.Add($line)
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
$js = "// ZX Spectrum Archive - game index used by finder_main.html and random.html`r`n" +
      "// GENERATED by tools\build-game-index.ps1 on $stamp - do not edit by hand,`r`n" +
      "// just run the script again after adding or changing a game page.`r`n" +
      "// f=file  t=title  p=publisher  y=year  s=score as shown  n=score 0-100 (-1 = none)  c=sections`r`n" +
      "var ZXSA_GAMES = [`r`n" + ($lines -join ",`r`n") + "`r`n];`r`n"

[System.IO.File]::WriteAllText($outFile, $js, $utf8)

Write-Host ""
Write-Host "Game index built: $($lines.Count) games written to $outFile" -ForegroundColor Green
foreach ($w in $warnings) { Write-Host "  Warning: $w" -ForegroundColor Yellow }
