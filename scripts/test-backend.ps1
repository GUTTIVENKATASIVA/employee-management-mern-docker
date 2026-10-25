# Installs backend dependencies and runs the automated backend tests.
. "$PSScriptRoot\common.ps1"
Set-Location (Join-Path $ProjectRoot 'backend')
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
npm test
if ($LASTEXITCODE -ne 0) { Write-Host 'Backend tests FAILED' -ForegroundColor Red; exit 1 }
Write-Host 'Backend tests passed.' -ForegroundColor Green
