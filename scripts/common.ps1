# Shared helpers, dot-sourced by the other scripts.
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Get-EnvValue {
    param([string]$Name, [string]$Default)
    $envFile = Join-Path $ProjectRoot '.env'
    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$Name\s*=" } | Select-Object -First 1
        if ($line) { return ($line -split '=', 2)[1].Trim() }
    }
    return $Default
}

function Wait-ForApi {
    param([string]$Url, [int]$MaxTries = 60)
    for ($i = 1; $i -le $MaxTries; $i++) {
        try {
            $health = Invoke-RestMethod -Uri $Url -TimeoutSec 3
            if ($health.status -eq 'ok') { return $true }
        } catch { }
        Start-Sleep -Seconds 2
    }
    return $false
}
