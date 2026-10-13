# =====================================================
# Safidy - run-local.ps1
# Charge backend\.env puis lance Spring Boot.
# Equivalent Windows de run-local.sh
# =====================================================
$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $racine ".env"

if (-not (Test-Path $envFile)) { throw "Fichier .env introuvable : $envFile" }

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $k = $matches[1]
        $v = $matches[2].Trim().Trim("'").Trim('"')
        Set-Item -Path "Env:$k" -Value $v
    }
}

Write-Host "Variables chargees :"
Write-Host "  DB_HOST=$env:DB_HOST"
Write-Host "  DB_NAME=$env:DB_NAME"
Write-Host "  DB_USERNAME=$env:DB_USERNAME"
Write-Host ""
Write-Host "=== Lancement Spring Boot ==="

& (Join-Path $racine "mvnw.cmd") spring-boot:run
