@echo off
title Image Converter
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Please install Node.js 22 or newer, then open this file again.
    pause
    exit /b 1
)
node scripts\start.mjs
if errorlevel 1 pause
