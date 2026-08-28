@echo off
title ZXSA Local Preview
echo Starting local preview of the ZXSA site...
echo.
echo A small status window will appear once it's running -- this console
echo window will close itself automatically. If it doesn't (or you see an
echo error below instead), open http://localhost:8791/ in your browser
echo manually once the server has started.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0zxsa_files\preview-server.ps1"
