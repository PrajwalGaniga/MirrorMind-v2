@echo off
setlocal enabledelayedexpansion

title MirrorMind v2 - Mobile App Launcher
color 0A

echo ======================================================================
echo           MIRRORMIND v2 - MOBILE APP ONE-CLICK LAUNCHER
echo ======================================================================
echo.

cd /d "%~dp0mobile"

echo [*] Checking connected ADB devices...
adb devices
echo.

echo [*] Launching Flutter on connected device...
echo [*] Tip: If wirelessly connecting, make sure your phone has Wireless Debugging ON.
echo.

flutter run

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Build or execution failed with code %ERRORLEVEL%.
    echo [*] Checking devices with flutter devices...
    flutter devices
    echo.
    pause
)

endlocal
