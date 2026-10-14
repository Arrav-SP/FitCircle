/**
 * Whether this browser can get FitCircle's notifications:
 * supported: yes.
 * needs-install: an iPhone or iPad in a browser tab; it has to be added to the home screen first.
 * unsupported: the browser has no push at all.
 * not-configured: the app was built without the public notification key.
 */
export type PushSupport = 'supported' | 'needs-install' | 'unsupported' | 'not-configured';

export function pushSupport(env: {
  configured: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  ios: boolean;
  standalone: boolean;
}): PushSupport {
  if (!env.configured) return 'not-configured';
  if (env.ios && !env.standalone) return 'needs-install';
  if (!env.hasServiceWorker || !env.hasPushManager) return 'unsupported';
  return 'supported';
}

/** "All on", "3 of 4 on" or "All off" for the kinds switched on. */
export function notifySummary(values: readonly boolean[]): string {
  const on = values.filter(Boolean).length;
  if (on === values.length) return 'All on';
  if (on === 0) return 'All off';
  return `${on} of ${values.length} on`;
}

/** The public key as the bytes the browser's subscribe call wants. */
export function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}
