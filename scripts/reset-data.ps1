# DANGER: removes containers AND the mongodb_data volume (all employee data).
. "$PSScriptRoot\common.ps1"
Set-Location $ProjectRoot
$answer = Read-Host 'This permanently deletes all employee data. Type YES to continue'
if ($answer -ne 'YES') { Write-Host 'Cancelled.'; exit 0 }
docker compose down -v
Write-Host 'All containers and the mongodb_data volume were removed.' -ForegroundColor Yellow
