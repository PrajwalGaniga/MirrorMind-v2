@echo off
setlocal enabledelayedexpansion

title MirrorMind v2 - Master Project Launcher
color 0B

:MENU
cls
echo ======================================================================
echo           MIRRORMIND v2 - MASTER PROJECT RUNNER
echo ======================================================================
echo.
echo   [1] Run Flutter Mobile App (Android Phone / Device)
echo   [2] Connect Wireless ADB Phone (IP : Port)
echo   [3] Run Backend Server (FastAPI + PyTorch on :8000)
echo   [4] Run Frontend Web (Next.js Visualizer on :3000)
echo   [5] Run FULL STACK (Backend + Frontend in Parallel)
echo   [6] Run Mobile Analysis and Checks (flutter analyze)
echo   [7] Open ML Viva Defense Guide (ML_EXAMINER_AND_GUIDE_DEFENSE_QA.md)
echo   [0] Exit
echo.
echo ======================================================================
set /p CHOICE="Enter your choice [0-7]: "

if "%CHOICE%"=="1" goto RUN_MOBILE
if "%CHOICE%"=="2" goto CONNECT_ADB
if "%CHOICE%"=="3" goto RUN_BACKEND
if "%CHOICE%"=="4" goto RUN_FRONTEND
if "%CHOICE%"=="5" goto RUN_FULLSTACK
if "%CHOICE%"=="6" goto RUN_ANALYZE
if "%CHOICE%"=="7" goto OPEN_GUIDE
if "%CHOICE%"=="0" goto EXIT_PROG

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

:RUN_MOBILE
cls
echo ======================================================================
echo Launching MirrorMind Mobile App...
echo ======================================================================
cd /d "%~dp0mobile"
echo [*] Connected ADB Devices:
adb devices
echo.
echo [*] Executing: flutter run
flutter run
pause
goto MENU

:CONNECT_ADB
cls
echo ======================================================================
echo Connect Wireless Android Debugging
echo ======================================================================
echo Check your Phone -^> Developer Options -^> Wireless Debugging
echo Look at "IP address & Port"
echo.
set /p PHONE_IP="Enter Phone IP (e.g. 172.16.103.167): "
set /p PHONE_PORT="Enter Port (e.g. 45735): "
echo.
echo [*] Connecting to %PHONE_IP%:%PHONE_PORT%...
adb connect %PHONE_IP%:%PHONE_PORT%
echo.
adb devices
echo.
pause
goto MENU

:RUN_BACKEND
cls
echo ======================================================================
echo Starting MirrorMind Backend Server (FastAPI + PyTorch)
echo ======================================================================
cd /d "%~dp0backend"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
echo [*] Starting uvicorn on http://127.0.0.1:8000
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
goto MENU

:RUN_FRONTEND
cls
echo ======================================================================
echo Starting MirrorMind Frontend Visualizer (Next.js)
echo ======================================================================
cd /d "%~dp0frontend"
echo [*] Starting Next.js on http://localhost:3000
npm run dev
pause
goto MENU

:RUN_FULLSTACK
cls
echo ======================================================================
echo Launching Full Stack (Backend + Frontend) in Separate Windows...
echo ======================================================================
start "MirrorMind Backend (:8000)" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start "MirrorMind Frontend (:3000)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo [*] Both Backend and Frontend windows launched successfully!
echo [*] Backend running at:  http://127.0.0.1:8000
echo [*] Frontend running at: http://localhost:3000
echo.
pause
goto MENU

:RUN_ANALYZE
cls
echo ======================================================================
echo Running Flutter Analysis & Checks...
echo ======================================================================
cd /d "%~dp0mobile"
flutter analyze
echo.
pause
goto MENU

:OPEN_GUIDE
cls
echo ======================================================================
echo Opening ML Examiner & Guide Defense QA Guide...
echo ======================================================================
start "" notepad "%~dp0ML_EXAMINER_AND_GUIDE_DEFENSE_QA.md"
goto MENU

:EXIT_PROG
echo Exiting. Good luck with your project!
exit /b 0
