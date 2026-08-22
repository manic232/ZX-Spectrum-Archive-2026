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

Write-Host "Hit any key to close and stop local server."

# GetContext() blocks until a request arrives, which would leave no chance to
# check for a keypress in between -- GetContextAsync() + a short Wait()
# timeout lets the loop poll for both a pending request AND a keypress every
# 200ms instead, so pressing a key can break out and stop the server cleanly.
$contextTask = $null
$canCheckKeys = $true
while ($listener.IsListening) {
    if ($canCheckKeys) {
        try {
            if ([Console]::KeyAvailable) {
                [Console]::ReadKey($true) | Out-Null
                break
            }
        } catch {
            # Console input isn't available (e.g. redirected/non-interactive
            # session) -- keep serving, just without the quit-on-keypress
            # feature, instead of spamming this error every poll.
            $canCheckKeys = $false
        }
    }
    if ($null -eq $contextTask) {
        $contextTask = $listener.GetContextAsync()
    }
    if (-not $contextTask.Wait(200)) {
        continue
    }
    $context = $contextTask.Result
    $contextTask = $null
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

$listener.Stop()
Write-Host "Server stopped."
