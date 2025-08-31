#!/bin/bash

echo "Starting Real-Time Financial Insights Dashboard..."
echo

echo "Checking environment setup..."
cd backend
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp env_example.txt .env
  echo ".env file created! Please update it with your API keys."
  
  # Try to open with common text editors
  if command -v nano &> /dev/null; then
    nano .env
  elif command -v vim &> /dev/null; then
    vim .env
  else
    echo "Please manually edit the .env file to add your API keys."
  fi
fi

echo "Starting backend..."
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo
echo "Application starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 