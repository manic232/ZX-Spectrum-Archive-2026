@echo off
rem Double-click this to rebuild docs\zxsa_files\games.js after adding or changing a game page.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-game-index.ps1"
echo.
pause
