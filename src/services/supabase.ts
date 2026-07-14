/**
 * Supabase client singleton.
 *
 * Reads connection details from EXPO_PUBLIC_* env vars (see .env.local),
 * which Expo inlines at build time — see
 * https://docs.expo.dev/versions/v57.0.0/guides/environment-variables/
 *
 * Auth sessions are persisted to AsyncStorage so a signed-in user stays
 * signed in across app restarts. `detectSessionInUrl` is disabled because
 * this is a native app, not a browser — there is no URL to inspect.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
