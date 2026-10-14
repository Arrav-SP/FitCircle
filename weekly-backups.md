# Weekly backups

The live Supabase database holds every workout, streak, weight entry and friendship. The free plan keeps no copy you can download, so these backups are the only way to recover if data is ever lost (a bad migration, a mistake in the SQL editor, the project being paused or deleted, or losing the account).

## When

| What | When |
|---|---|
| Take a backup | Once a week, and just before every `npx supabase db push` |
| Test a restore | About once a month |

## Take a backup

1. Open Docker Desktop and wait until it says it is running.
2. In the project folder, run:
   ```
   powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
   ```
3. If it asks for the database password: Supabase dashboard > Project Settings > Database.
4. The last line says `Saved to ...\backups\<date>_<time>`. Note the folder name, e.g. `2026-10-15_0129`.

Each backup folder holds `schema.sql` (the structure) and `data.sql` (everyone's data).

## Test a restore

This loads a backup into the **local** database only; the live app is never touched. It wipes the local database first.

```
powershell -ExecutionPolicy Bypass -File scripts\restore-local.ps1 backups\<folder name>
```

It ends with a small table of users, workouts, streaks and health entries. If the numbers roughly match the app, the backup works.

## Looking after the backups

- They are ordinary files in `backups\` and survive shutdowns and restarts.
- Keep the newest 4 or so and delete older ones.
- Now and then copy the newest one to a USB drive or private cloud storage only you can access, in case the laptop is lost or its drive fails.
- Never send, share or upload a backup: it contains everyone's data and sign-in tokens. `backups\` is in `.gitignore`, so it is never committed.

## If data is ever really lost

Putting a backup back into the live database is a separate, careful job. Do not improvise it: stop using the app and ask for help first.
