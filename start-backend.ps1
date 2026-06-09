# TestAP Backend Starter
$backendDir = "$PSScriptRoot\backend"
Set-Location $backendDir

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet

Write-Host "Running database migrations..." -ForegroundColor Yellow
& ".\venv\Scripts\alembic.exe" upgrade head

Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Cyan
& ".\venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000
