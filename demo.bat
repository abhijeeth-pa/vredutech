@echo off
REM VR Classroom Demo Script for Windows
REM Usage: demo.bat

setlocal enabledelayedexpansion

set SERVER_PORT=3001
set CLIENT_PORT=3000

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║       VR Classroom Multi-User Demo - Quick Launcher        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Starting VR Server on port %SERVER_PORT%...
cd server
call npm install > nul 2>&1
start "VR Server" cmd /k npm start
cd ..
timeout /t 2 /nobreak

echo ✓ Starting Next.js Client on port %CLIENT_PORT%...
call npm install > nul 2>&1
start "VR Client" cmd /k npm run dev
timeout /t 4 /nobreak

echo.
echo 📱 Opening classroom rooms in browser...
echo.

REM Generate timestamp for unique room ID
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set ROOM_ID=demo-%mydate%-%mytime%
set ROOM_NAME=Demo Classroom

REM URLs
set TEACHER_URL=http://localhost:%CLIENT_PORT%/classroom/room/%ROOM_ID%?host=true^&user=Teacher^&name=%ROOM_NAME%
set STUDENT1_URL=http://localhost:%CLIENT_PORT%/classroom/room/%ROOM_ID%?host=false^&user=Student1^&name=%ROOM_NAME%
set STUDENT2_URL=http://localhost:%CLIENT_PORT%/classroom/room/%ROOM_ID%?host=false^&user=Student2^&name=%ROOM_NAME%
set STUDENT3_URL=http://localhost:%CLIENT_PORT%/classroom/room/%ROOM_ID%?host=false^&user=Student3^&name=%ROOM_NAME%

echo ✓ Teacher:   %TEACHER_URL%
echo ✓ Student 1: %STUDENT1_URL%
echo ✓ Student 2: %STUDENT2_URL%
echo ✓ Student 3: %STUDENT3_URL%

echo.
echo 🌐 Opening in browser...

REM Open in default browser
start "" "%TEACHER_URL%"
timeout /t 1 /nobreak
start "" "%STUDENT1_URL%"
start "" "%STUDENT2_URL%"

echo.
echo ✓ Demo ready!
echo.
echo 💡 Quick Testing Tips:
echo    1. Open DevTools (F12) ^> Network tab ^> filter by 'websocket'
echo    2. Click 'Enter VR' button to test WebXR (requires headset or emulator)
echo    3. Click 'Whiteboard' to open collaborative drawing
echo    4. Teacher can click 'Mute All' to silence students
echo    5. See participants panel on right side
echo    6. Try dragging camera (mouse) to move around and see avatar updates
echo.
echo 📊 Monitoring:
echo    Server logs in "VR Server" window
echo    Browser console (F12 ^> Console) for client logs
echo.
echo 🛑 To stop: Close the windows or press Ctrl+C in terminals
echo.
pause
