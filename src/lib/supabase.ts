import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  );
}

// shortcut: uses the browser's default session storage, web only; pass a storage adapter when native builds start.
export const supabase = createClient(url, anonKey, {
  auth: { flowType: 'pkce' },
});
