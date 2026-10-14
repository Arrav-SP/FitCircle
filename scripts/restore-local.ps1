# Proves a backup is usable by loading it into the LOCAL database (never the hosted one).
# It wipes the local database first, rebuilds it from the migrations, then loads the backup's data.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File scripts\restore-local.ps1 backups\2026-10-15_0900
param([Parameter(Mandatory)][string]$Backup)

$ErrorActionPreference = 'Stop'
$data = Join-Path $Backup 'data.sql'
if (-not (Test-Path $data)) { throw "No data.sql in $Backup" }

npx supabase db reset
if ($LASTEXITCODE) { throw 'The local reset failed.' }

$db = docker ps --format '{{.Names}}' | Where-Object { $_ -like 'supabase_db_*' } | Select-Object -First 1
docker cp $data "${db}:/tmp/restore.sql"
# The migrations seed the shared exercise list, which is also in the backup, so empty the app tables first.
$empty = "select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' cascade' from pg_tables where schemaname = 'public' \gexec"
$empty | docker exec -i $db psql -U postgres -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE) { throw 'Emptying the local tables failed.' }
# supabase_admin: the auth and storage tables belong to Supabase's own roles, not to postgres.
docker exec $db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q --single-transaction -f /tmp/restore.sql
if ($LASTEXITCODE) { throw 'Loading the backup failed. The local database is now empty; run npx supabase db reset.' }
docker exec $db rm /tmp/restore.sql

docker exec $db psql -U postgres -c "select (select count(*) from auth.users) as users, (select count(*) from public.workouts) as workouts, (select count(*) from public.streak_challenges) as streaks, (select count(*) from public.metric_entries) as health_entries"
