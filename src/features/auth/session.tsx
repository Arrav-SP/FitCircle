import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { forgetThisDevice } from '@/features/notifications/device';
import { isIdleExpired } from '@/lib/idle';
import { queryClient } from '@/lib/query';
import { supabase } from '@/lib/supabase';

type SessionState = { session: Session | null; loading: boolean };

const SessionContext = createContext<SessionState>({ session: null, loading: true });

// shortcut: idle sign-out is tracked per device in the browser; move it to Supabase's
// server-side inactivity timeout (a paid-plan setting) if the app ever goes public.
const LAST_ACTIVE_KEY = 'fitcircle.lastActive';

function readLastActive(): number | null {
  const stored = localStorage.getItem(LAST_ACTIVE_KEY);
  return stored === null ? null : Number(stored);
}

function touchLastActive() {
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true });

  useEffect(() => {
    // Fires once with the stored session (or the one from a sign-in redirect), then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        localStorage.removeItem(LAST_ACTIVE_KEY);
      } else if (isIdleExpired(readLastActive(), Date.now())) {
        // Deferred: Supabase calls must not run inside this callback.
        setTimeout(signOut, 0);
        setState({ session: null, loading: false });
        return;
      } else {
        touchLastActive();
      }
      setState({ session, loading: false });
    });

    // Coming back to the tab counts as using the app.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem(LAST_ACTIVE_KEY)) touchLastActive();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}

export function useSession() {
  return use(SessionContext);
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  // Stop this device getting the account's notifications; never let that block signing out.
  await forgetThisDevice().catch(() => undefined);
  await supabase.auth.signOut();
  // Drop cached data so the next person on this device never sees it.
  queryClient.clear();
}
