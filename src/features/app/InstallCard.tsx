import { useEffect, useState } from 'react';

import { Tile, TileIcon } from '@/components/Tile';

import { installState } from './install';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type InstallWindow = Window & { fitcircleInstallPrompt?: InstallPrompt };

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

/** Offers to put FitCircle on the home screen; hidden once it is running from there. */
export function InstallCard() {
  const [offer, setOffer] = useState(() => (window as InstallWindow).fitcircleInstallPrompt ?? null);
  const [installed, setInstalled] = useState(standalone);

  useEffect(() => {
    // The offer is caught in public/index.html, possibly after this screen first rendered.
    const ready = () => setOffer((window as InstallWindow).fitcircleInstallPrompt ?? null);
    const done = () => setInstalled(true);
    window.addEventListener('fitcircle-install-ready', ready);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('fitcircle-install-ready', ready);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  const state = installState({ standalone: installed, canPrompt: offer !== null, userAgent: navigator.userAgent });
  if (state === 'installed') return null;

  const install = async () => {
    if (!offer) return;
    await offer.prompt();
    const { outcome } = await offer.userChoice;
    // The browser's offer can only be used once.
    (window as InstallWindow).fitcircleInstallPrompt = undefined;
    setOffer(null);
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <Tile
      title="Install FitCircle"
      caption={
        state === 'ios'
          ? 'Safari: Share, then Add to Home Screen'
          : state === 'manual'
            ? 'Browser menu: Install app'
            : 'Tap to add it to your home screen'
      }
      captionTone={state === 'prompt' ? 'accent' : 'muted'}
      onPress={state === 'prompt' ? install : undefined}>
      <TileIcon name="download-outline" />
    </Tile>
  );
}
