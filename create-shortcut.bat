@echo off
:: Creates a desktop shortcut for Lakeland Hub with the custom icon
echo Creating desktop shortcut...

cd /d "%~dp0"

set SCRIPT_DIR=%~dp0
set ICO_PATH=%SCRIPT_DIR%public\lakeland-hub.ico
set BAT_PATH=%SCRIPT_DIR%start-lakeland.bat
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Lakeland Hub.lnk

:: Use PowerShell to create a proper shortcut with icon
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT_PATH%'); $sc.TargetPath = '%BAT_PATH%'; $sc.WorkingDirectory = '%SCRIPT_DIR%'; $sc.IconLocation = '%ICO_PATH%'; $sc.Description = 'Launch Lakeland Hub App'; $sc.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo Done! "Lakeland Hub" shortcut created on your Desktop.
) else (
    echo.
    echo Failed to create shortcut. You can manually create one by:
    echo   1. Right-click start-lakeland.bat
    echo   2. Send to ^> Desktop (create shortcut^)
    echo   3. Right-click the shortcut ^> Properties ^> Change Icon
    echo   4. Browse to: %ICO_PATH%
)

pause
