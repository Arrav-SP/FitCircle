# Copies the hosted FitCircle database into backups\<date>\ (git-ignored: it holds everyone's data).
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
# Needs Docker running. If asked for the database password: Supabase dashboard > Project Settings > Database.
param([switch]$Local) # -Local dumps the local database instead, to test this script.

$ErrorActionPreference = 'Stop'
$target = if ($Local) { '--local' } else { '--linked' }
$dir = Join-Path (Split-Path $PSScriptRoot) ('backups\' + (Get-Date -Format 'yyyy-MM-dd_HHmm'))
New-Item -ItemType Directory -Force $dir | Out-Null

npx supabase db dump $target -f "$dir\schema.sql"
if ($LASTEXITCODE) { throw 'The schema dump failed.' }
npx supabase db dump $target --data-only --use-copy -f "$dir\data.sql"
if ($LASTEXITCODE) { throw 'The data dump failed.' }

"Saved to $dir"
