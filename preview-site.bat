@echo off
echo Starting local preview of the ZXSA site...
echo Once it's running, open http://localhost:8791/ in your browser.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0zxsa_files\preview-server.ps1"
