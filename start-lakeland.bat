@echo off
title Lakeland Hub App
echo ============================================
echo    Lakeland Hub App - Starting...
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Download it from https://nodejs.org
    pause
    exit /b 1
)

:: Navigate to the script's own directory
cd /d "%~dp0"

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo Installing dependencies (first run only)...
    call npm install
    echo.
)

:: Install serve globally if not present
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing serve (first run only)...
    call npm install -g serve
    echo.
)

:: Build the production bundle
echo Building the app...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed. Check the output above.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    App is running at http://localhost:3000
echo    Press Ctrl+C to stop the server.
echo ============================================
echo.

:: Serve the production build
serve -s build -l 3000
pause
