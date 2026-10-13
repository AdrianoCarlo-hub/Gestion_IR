# =====================================================
# Safidy - init.ps1
# Cree et initialise la base PostgreSQL "safidy".
# A executer une fois le service PostgreSQL demarre.
#   .\init.ps1            -> cree la base et les donnees si vide
#   .\init.ps1 -Recreate  -> DROP puis recree tout
# =====================================================
param(
    [string]$PgBin      = "",
    [string]$DbHost     = "localhost",
    [int]   $Port       = 5432,
    [string]$DbName     = "safidy",
    [string]$DbUser     = "postgres",
    [string]$DbPassword = "Lovanirina#3",
    [switch]$Recreate
)

$ErrorActionPreference = "Stop"

if (-not $PgBin) {
    $cand = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
    if (-not $cand) { throw "psql.exe introuvable. Passe -PgBin <chemin vers le dossier bin de PostgreSQL>." }
    $PgBin = $cand.DirectoryName
}
$psql = Join-Path $PgBin "psql.exe"
$env:PGPASSWORD = $DbPassword

Write-Host "== Safidy : initialisation de la base =="
Write-Host "psql   : $psql"
Write-Host "cible  : $DbUser@$DbHost`:$Port/$DbName"

$svc = Get-Service | Where-Object { $_.Name -match "postgres" } | Select-Object -First 1
if ($svc -and $svc.Status -ne "Running") {
    Write-Host "Service '$($svc.Name)' arrete, tentative de demarrage..."
    try { Start-Service $svc.Name } catch {
        throw "Impossible de demarrer '$($svc.Name)' (droits admin requis). Ouvre un PowerShell en administrateur et relance."
    }
    Start-Sleep -Seconds 2
}

$ready = & (Join-Path $PgBin "pg_isready.exe") -h $DbHost -p $Port
Write-Host $ready
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL ne repond pas sur $DbHost`:$Port." }

if ($Recreate) {
    Write-Host "DROP DATABASE $DbName ..."
    & $psql -h $DbHost -p $Port -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DbName WITH (FORCE);"
}

$exists = (& $psql -h $DbHost -p $Port -U $DbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'").Trim()
if ($exists -ne "1") {
    Write-Host "CREATION de la base $DbName ..."
    & $psql -h $DbHost -p $Port -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName ENCODING 'UTF8';"
} else {
    Write-Host "Base $DbName deja presente."
}

# Ne rien ecraser si la base est deja initialisee (sauf -Recreate)
if (-not $Recreate -and $exists -eq "1") {
    $tableAgent = (& $psql -h $DbHost -p $Port -U $DbUser -d $DbName -tAc "SELECT to_regclass('public.agent') IS NOT NULL;").Trim()
    if ($tableAgent -eq "t") {
        $nb = (& $psql -h $DbHost -p $Port -U $DbUser -d $DbName -tAc "SELECT count(*) FROM agent;").Trim()
        if ([int]$nb -gt 0) {
            Write-Host ""
            Write-Host "Base deja initialisee ($nb agents). Aucune modification."
            Write-Host "Pour tout reconstruire : .\init.ps1 -Recreate"
            exit 0
        }
    }
}

$racine = $PSScriptRoot
$scripts = @(
    "02_create_tables.sql",
    "03_create_constraints.sql",
    "04_create_indexes.sql",
    "05_insert_parameters.sql",
    "09_add_taux_ir.sql",
    "10_migration_acomptes.sql",
    "11_migration_penalites.sql",
    "12_migration_suspensions.sql",
    "08_migration_libelle.sql",
    "08_seed_complet.sql"
)

foreach ($s in $scripts) {
    $f = Join-Path $racine $s
    if (-not (Test-Path $f)) { throw "Script manquant : $f" }
    Write-Host "--- $s"
    & $psql -h $DbHost -p $Port -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -q -f $f
    if ($LASTEXITCODE -ne 0) { throw "Echec sur $s" }
}

Write-Host ""
Write-Host "== Termine. Contenu de la base : =="
& $psql -h $DbHost -p $Port -U $DbUser -d $DbName -c "SELECT 'agents' AS table, count(*) FROM agent UNION ALL SELECT 'contribuables', count(*) FROM contribuable UNION ALL SELECT 'declarations', count(*) FROM declaration_ir UNION ALL SELECT 'parametres', count(*) FROM parametre_fiscal;"
Write-Host ""
Write-Host "Comptes de test (mot de passe : admin1234) :"
& $psql -h $DbHost -p $Port -U $DbUser -d $DbName -c "SELECT email, role FROM agent ORDER BY id_agent;"
