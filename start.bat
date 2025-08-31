@echo off
echo Starting Real-Time Financial Insights Dashboard...
echo.

echo Checking environment setup...
cd backend
if not exist .env (
  echo Creating .env file from template...
  copy env_example.txt .env
  echo .env file created! Please update it with your API keys.
  notepad .env
  echo After saving the .env file, close Notepad and press any key to continue...
  pause > nul
)

echo Starting backend...
start "Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting frontend...
cd ..\frontend
start "Frontend" cmd /k "npm start"

echo.
echo Application starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
pause 