/**
 * What the Install row in Profile offers:
 * installed: already running from the home screen, so nothing to show.
 * prompt: the browser (Chrome on Android) can show its install dialog from our button.
 * ios: iPhone or iPad, where installing is Share, then Add to Home Screen.
 * manual: anything else; the browser menu has the option if the browser supports it.
 */
export type InstallState = 'installed' | 'prompt' | 'ios' | 'manual';

export function installState(env: { standalone: boolean; canPrompt: boolean; userAgent: string }): InstallState {
  if (env.standalone) return 'installed';
  if (env.canPrompt) return 'prompt';
  if (isIos(env.userAgent)) return 'ios';
  return 'manual';
}

export function isIos(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}
