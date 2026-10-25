# Installs frontend dependencies, builds the app with Vite and verifies the output.
. "$PSScriptRoot\common.ps1"
Set-Location (Join-Path $ProjectRoot 'frontend')
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
npm run check
if ($LASTEXITCODE -ne 0) { Write-Host 'Frontend build check FAILED' -ForegroundColor Red; exit 1 }
Write-Host 'Frontend build check passed.' -ForegroundColor Green
