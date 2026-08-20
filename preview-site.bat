@echo off
echo Starting local preview of the ZXSA site...
echo This window must stay open while you're testing. Close it when you're done.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0zxsa_files\preview-server.ps1"
