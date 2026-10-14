import { isIos } from '@/features/app/install';
import { supabase } from '@/lib/supabase';

import { keyBytes, pushSupport, type PushSupport } from './push';

// Public by design: browsers need it to subscribe. The matching private key lives only in Supabase secrets.
const PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export function currentSupport(): PushSupport {
  return pushSupport({
    configured: PUBLIC_KEY !== '',
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    ios: isIos(navigator.userAgent),
    standalone:
      window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
  });
}

/** The service worker's registration, or null if it is not running (for example on the dev server). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
}

async function save(subscription: PushSubscription) {
  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase.schema('api').rpc('save_push_subscription', {
    p_endpoint: endpoint,
    p_p256dh: keys?.p256dh,
    p_auth: keys?.auth,
  });
  if (error) throw error;
}

/** This browser's subscription, re-saved so the server is in step (it may have been dropped or moved). */
export async function syncThisDevice(): Promise<boolean> {
  const subscription = await (await registration())?.pushManager.getSubscription();
  if (!subscription) return false;
  await save(subscription);
  return true;
}

/** Asks for permission and subscribes. Call straight from a tap: iPhones only ask inside one. */
export async function turnOnThisDevice(): Promise<'on' | 'denied'> {
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';
  const ready = await registration();
  if (!ready) throw new Error('no_service_worker');
  const subscription =
    (await ready.pushManager.getSubscription()) ??
    (await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
  await save(subscription);
  return 'on';
}

/** Stops notifications to this browser, for this account. Also used at sign-out. */
export async function forgetThisDevice() {
  if (currentSupport() !== 'supported') return;
  const subscription = await (await registration())?.pushManager.getSubscription();
  if (!subscription) return;
  await supabase.schema('api').rpc('remove_push_subscription', { p_endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
