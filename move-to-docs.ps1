# move-to-docs.ps1
# Moves everything in the repo (except README, .git, LICENSE, and this script)
# into a /docs folder, then commits and pushes.
#
# HOW TO USE:
# 1. Save this file directly inside C:\Users\Michael\Dropbox\GitHub\zxsa-2026
# 2. Right-click it -> "Run with PowerShell"
#    (If Windows blocks it, right-click -> Properties -> tick "Unblock" -> OK, then try again)
# 3. Watch the output. It will pause before pushing so you can double check.

$ErrorActionPreference = "Stop"

# Make sure we're running from inside the repo
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: This doesn't look like the repo root (no .git folder found)." -ForegroundColor Red
    Write-Host "Move this script into C:\Users\Michael\Dropbox\GitHub\zxsa-2026 and run it from there."
    Read-Host "Press Enter to exit"
    exit 1
}

# Files/folders to leave at the repo root (case-insensitive)
$keepAtRoot = @(".git", "docs", "README.md", "LICENSE", "move-to-docs.ps1", ".gitignore")

# Create docs folder if it doesn't exist
if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" | Out-Null
    Write-Host "Created docs\ folder" -ForegroundColor Green
}

# Move everything else into docs\
Get-ChildItem -Force | Where-Object {
    $keepAtRoot -notcontains $_.Name
} | ForEach-Object {
    Write-Host "Moving $($_.Name) -> docs\$($_.Name)"
    Move-Item -Path $_.FullName -Destination "docs\$($_.Name)" -Force
}

Write-Host ""
Write-Host "All files moved into docs\." -ForegroundColor Green
Write-Host ""

# Sanity check: warn if CNAME didn't make it into docs
if (Test-Path "docs\CNAME") {
    Write-Host "CNAME found inside docs\ - good." -ForegroundColor Green
} else {
    Write-Host "WARNING: No CNAME file found inside docs\. If you use a custom domain, check this manually!" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to continue with git add / commit / push (or close this window to stop here)"

git add -A
git commit -m "Move site into /docs for tidier repo root"
git push

Write-Host ""
Write-Host "Done! Now go to GitHub -> Settings -> Pages -> change source folder to /docs" -ForegroundColor Cyan
Read-Host "Press Enter to exit"