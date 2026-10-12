-- Closes due streak days every 15 minutes. Kept apart from the streak tables so that, if the scheduler
-- is unavailable, only this file fails; the app also closes a user's own due days whenever it loads streaks.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('finalise-streaks', '*/15 * * * *', $$select private.finalise_due_streaks()$$);
