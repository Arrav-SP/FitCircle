-- api: functions the app may call. private: security-definer internals, never exposed.
create schema if not exists api;
create schema if not exists private;

grant usage on schema api to authenticated;
revoke all on schema private from public, anon, authenticated;

-- Functions created by migrations are not callable by anyone until explicitly granted.
alter default privileges revoke execute on functions from public;
