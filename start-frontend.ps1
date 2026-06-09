# TestAP Frontend Starter
$frontendDir = "$PSScriptRoot\frontend"
$nodePath = "C:\nodejs-extract\node-v22.22.2-win-x64"

# Try to find npm in PATH first, then fallback to extracted path
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    if (Test-Path "$nodePath\npm.cmd") {
        $env:PATH = "$nodePath;" + $env:PATH
        $npmCmd = "$nodePath\npm.cmd"
    } else {
        Write-Host "npm not found. Install Node.js from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
}

Set-Location $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmCmd install
}

Write-Host "Starting Vite dev server on http://localhost:5173" -ForegroundColor Green
& $npmCmd run dev
