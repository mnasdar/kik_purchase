@echo off
start cmd /k "yarn dev"
timeout /t 3 >nul

start "" "C:\Program Files\Mozilla Firefox\firefox.exe" "https://purchasing.test/"
