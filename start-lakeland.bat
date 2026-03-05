@echo off
title Lakeland Hub App
echo ============================================
echo    Lakeland Hub App - Starting...
echo ============================================
echo.

:: Navigate to the script's own directory first
cd /d "%~dp0"
if %errorlevel% neq 0 (
    echo ERROR: Could not navigate to app folder.
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Download it from https://nodejs.org
    pause
    exit /b 1
)

echo Found Node.js:
node --version
echo.

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo Installing dependencies - first run only, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
    echo.
)

:: Install serve globally if not present
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing serve - first run only...
    call npm install -g serve
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install serve.
        pause
        exit /b 1
    )
    echo.
)

:: Build the production bundle
echo Building the app...
call npm run build
if %errorlevel% neq 0 (
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

:: Open the browser automatically
start http://localhost:3000

:: Serve the production build
call serve -s build -l 3000

:: If we get here, serve exited unexpectedly
echo.
echo Server has stopped.
pause
