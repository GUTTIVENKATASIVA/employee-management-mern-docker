# Stops and removes the containers. The mongodb_data volume (your data) is KEPT.
. "$PSScriptRoot\common.ps1"
Set-Location $ProjectRoot
docker compose down
Write-Host 'Containers removed. Data is still stored in the mongodb_data volume.' -ForegroundColor Green
