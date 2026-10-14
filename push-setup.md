# Push notifications: one-time setup

Do this once, in order, from the project folder in PowerShell. Docker Desktop should be running.

Three secret values come up below. Keep them out of chats, screenshots and commits:
- the VAPID private key
- the cron secret
- your database password

`.env` is already in `.gitignore`.

## 1. Make the notification keys

```
npx web-push generate-vapid-keys
```

It prints a **Public Key** and a **Private Key**. Keep this window open.

## 2. Make a cron secret

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

It prints a long random string: that's your **cron secret**. Keep it with the keys.

## 3. Put the public key in the app

Open `.env` and add a line (the public key from step 1, no quotes):

```
EXPO_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```

It's safe for this key to end up in the app; it's meant to be public.

## 4. Give the secrets to Supabase

One command, with your own values in place of the `<...>` parts:

```
npx supabase secrets set VAPID_PUBLIC_KEY=<public key> VAPID_PRIVATE_KEY=<private key> VAPID_SUBJECT=mailto:<an email you're happy push services see> PUSH_CRON_SECRET=<cron secret>
```

The push services (Google, Apple) use that email only to contact you if your app misbehaves.

Expected: "Finished supabase secrets set."

## 5. Update the database

Back up first, then push:

```
powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
npx supabase db push
```

Expected: it lists `20261025000000_push.sql`, plus any earlier ones not yet pushed. Type `y`.

## 6. Deploy the sending function

```
npx supabase functions deploy send-push
```

Expected: "Deployed Functions on project gjggdautcoevczqjdlnn: send-push".

## 7. Tell the database where the function is

In the Supabase dashboard, open **SQL Editor**, then **New query**. Paste this, with your cron secret in place of `<cron secret>`, and press **Run**:

```sql
select vault.create_secret('https://gjggdautcoevczqjdlnn.supabase.co/functions/v1/send-push', 'push_function_url');
select vault.create_secret('<cron secret>', 'push_cron_secret');
```

## 8. Build and deploy the app

```
npm run build:web
npx eas-cli@latest deploy --prod
```

## 9. Test on your phone

1. Open the **installed** FitCircle and go to **Profile**, then **Notifications**.
2. Turn on **On this phone** and allow notifications when asked.
3. Tap **Send a test notification**. Within about a minute: "Notifications are working".
4. Tap the notification: FitCircle opens on Profile.

## If the test notification doesn't arrive

In the SQL Editor, run:

```sql
select category, created_at, sent_at, failed_at, attempts, last_error
from private.notification_outbox order by id desc limit 5;
```

| What you see | What it means |
|---|---|
| No row | The switch didn't save this phone. Turn it off and on again |
| `sent_at` empty, `attempts` 0, after 2 minutes | The database isn't reaching the function. Check step 7's address and that the cron secret matches step 4 |
| `last_error` mentions 401 or 403 | The notification keys don't match. Redo steps 3 and 4 with the same pair, then rebuild and redeploy |
| `sent_at` filled but nothing on the phone | Check that the phone allows notifications for FitCircle (Settings, then Notifications) |

If you ever change the keys, everyone has to turn **On this phone** off and on again.
