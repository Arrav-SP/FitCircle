// Sends queued push notifications. The database calls this every minute while something is waiting
// (private.kick_push), with a shared secret instead of a user's sign-in, so it is deployed without JWT checks.
import postgres from 'npm:postgres@3.4.5';
import webpush from 'npm:web-push@3.6.7';

type Device = { endpoint: string; p256dh: string; auth: string };
type Claimed = { id: string; title: string; body: string; url: string; category: string; subscriptions: Device[] };
type Outcome = { endpoint: string; ok: boolean; gone: boolean; error: string };

const secret = Deno.env.get('PUSH_CRON_SECRET');
const vapidDetails = {
  subject: Deno.env.get('VAPID_SUBJECT') ?? '',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
};

// web-push only builds the encrypted request here; its own sender needs Node's https, so fetch sends it.
async function send(device: Device, payload: string): Promise<Outcome> {
  try {
    const request = webpush.generateRequestDetails(
      { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      payload,
      { vapidDetails, TTL: 4 * 60 * 60, urgency: 'high' },
    );
    const headers = Object.fromEntries(
      Object.entries(request.headers)
        .filter(([name]) => name.toLowerCase() !== 'content-length')
        .map(([name, value]) => [name, String(value)]),
    );
    const response = await fetch(request.endpoint, { method: 'POST', headers, body: request.body });
    await response.body?.cancel();
    // 404 and 410 mean the browser dropped this subscription for good.
    return { endpoint: device.endpoint, ok: response.ok, gone: response.status === 404 || response.status === 410, error: `HTTP ${response.status}` };
  } catch (error) {
    return { endpoint: device.endpoint, ok: false, gone: false, error: String(error) };
  }
}

Deno.serve(async (request) => {
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return new Response('Forbidden', { status: 403 });
  }
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 1 });
  try {
    const rows = await sql<Claimed[]>`select * from private.claim_notifications(100)`;
    let sent = 0;
    for (const row of rows) {
      const payload = JSON.stringify({ title: row.title, body: row.body, url: row.url, tag: row.category });
      const outcomes = await Promise.all(row.subscriptions.map((device) => send(device, payload)));
      for (const outcome of outcomes.filter((each) => each.gone)) {
        await sql`delete from public.push_subscriptions where endpoint = ${outcome.endpoint}`;
      }
      const ok = outcomes.some((each) => each.ok);
      if (ok) sent += 1;
      const error = outcomes.length === 0 ? 'no devices' : outcomes.map((each) => each.error).join('; ');
      await sql`select private.finish_notification(${row.id}, ${ok}, ${ok ? null : error})`;
    }
    return Response.json({ claimed: rows.length, sent });
  } finally {
    await sql.end();
  }
});
