@echo off
cd /d "%~dp0"
echo Starting Our Circle Development Server...
start http://localhost:5173/
npm run dev
