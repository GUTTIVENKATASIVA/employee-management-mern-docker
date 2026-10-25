# Builds and starts the whole stack (frontend, backend, mongodb).
. "$PSScriptRoot\common.ps1"
Set-Location $ProjectRoot

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Created .env from .env.example. Open it and change MONGO_ROOT_PASSWORD.' -ForegroundColor Yellow
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed. Is Docker Desktop running?' }

$frontendPort = Get-EnvValue 'FRONTEND_PORT' '8080'
Write-Host 'Waiting for the application to become healthy...'
if (Wait-ForApi "http://localhost:$frontendPort/api/health") {
    Write-Host "Ready! Open http://localhost:$frontendPort" -ForegroundColor Green
} else {
    Write-Host 'The app did not become healthy in time. Run: docker compose logs' -ForegroundColor Red
    exit 1
}
