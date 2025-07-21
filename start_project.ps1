Write-Host "Starting Financial Dashboard..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -c `"import uvicorn; from app.main import app; uvicorn.run(app, host='127.0.0.1', port=8000)`""

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Set-Location ../frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 