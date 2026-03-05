@echo off
title Lakeland Hub App
echo ============================================
echo    Lakeland Hub App - Starting...
echo ============================================
echo.

:: Navigate to the script's own directory first
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 goto :nonode

echo Found Node.js:
node --version
echo.

:: Install dependencies if node_modules is missing
if exist "node_modules\" goto :skipdeps
echo Installing dependencies - first run only, please wait...
call npm install
if %errorlevel% neq 0 goto :installfail
echo.

:skipdeps
:: Install serve globally if not present
where serve >nul 2>&1
if %errorlevel% equ 0 goto :skipserve
echo Installing serve - first run only...
call npm install -g serve
if %errorlevel% neq 0 goto :servefail
echo.

:skipserve
:: Build the production bundle
echo Building the app...
call npm run build
if %errorlevel% neq 0 goto :buildfail

echo.
echo ============================================
echo    App is running at http://localhost:3000
echo    Press Ctrl+C to stop the server.
echo ============================================
echo.

:: Open the browser automatically
start http://localhost:3000

:: Serve the production build
call serve -s build -l 3000

echo.
echo Server has stopped.
pause
goto :eof

:nonode
echo.
echo ERROR: Node.js is not installed or not in your PATH.
echo Download it from https://nodejs.org
pause
goto :eof

:installfail
echo.
echo ERROR: npm install failed.
pause
goto :eof

:servefail
echo.
echo ERROR: Failed to install serve.
pause
goto :eof

:buildfail
echo.
echo ERROR: Build failed. Check the output above.
pause
goto :eof
