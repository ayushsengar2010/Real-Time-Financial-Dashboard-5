@echo off
echo Starting Financial Dashboard...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python -c \"import uvicorn; from app.main import app; uvicorn.run(app, host='127.0.0.1', port=8000)\""

echo.
echo Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit this script...
pause > nul 