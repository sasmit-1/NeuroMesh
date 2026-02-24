@echo off
title NeuroMesh Engine Startup

cd /d "%~dp0"

echo ==================================================
echo   IGNITING NEUROMESH DEVELOPMENT ENVIRONMENT...
echo ==================================================
echo.

:: Start the Python Backend in a new terminal window
echo [1/2] Starting FastAPI Backend...
:: THE FIX: Activate venv first, then cd into backend
start "NeuroMesh Backend" cmd /k "call venv\Scripts\activate && cd backend && uvicorn main:app --reload"

:: Start the React Frontend in a new terminal window
echo [2/2] Starting React Frontend...
start "NeuroMesh Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==================================================
echo   ALL SYSTEMS GO! 
echo   Close this window at any time.
echo ==================================================
pause