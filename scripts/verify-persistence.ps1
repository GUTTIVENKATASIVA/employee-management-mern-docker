# Proves that data survives container removal and recreation (volume mongodb_data).
# Steps: create a record -> docker compose down -> docker compose up -> check the record.
. "$PSScriptRoot\common.ps1"
Set-Location $ProjectRoot

$port = Get-EnvValue 'FRONTEND_PORT' '8080'
$api = "http://localhost:$port/api"

if (-not (Wait-ForApi "$api/health" 5)) {
    Write-Host 'Stack is not running. Starting it first...'
    docker compose up -d --build
    if (-not (Wait-ForApi "$api/health")) { throw 'Application did not start.' }
}

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$email = "persistence.$stamp@example.com"
$body = @{
    name = 'Persistence Check'; email = $email; phone = ''; department = 'IT Support'
    position = 'Test Account'; salary = 500000; joiningDate = '2024-01-01'; status = 'Active'
} | ConvertTo-Json

Write-Host "1. Creating test employee $email"
$created = Invoke-RestMethod -Method Post -Uri "$api/employees" -ContentType 'application/json' -Body $body

Write-Host '2. Removing all containers (docker compose down, volume is kept)'
docker compose down
Write-Host '3. Starting fresh containers'
docker compose up -d
if (-not (Wait-ForApi "$api/health")) { throw 'Application did not come back up.' }

Write-Host '4. Looking for the test employee'
$found = Invoke-RestMethod -Uri "$api/employees?search=$email"
if ($found.count -ge 1) {
    Write-Host 'PASS: the employee survived container recreation.' -ForegroundColor Green
    Invoke-RestMethod -Method Delete -Uri "$api/employees/$($created.data.id)" | Out-Null
    Write-Host 'Test employee cleaned up.'
} else {
    Write-Host 'FAIL: the employee was not found after recreation.' -ForegroundColor Red
    exit 1
}
