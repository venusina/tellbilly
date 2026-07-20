/**
 * Supabase client singleton.
 *
 * Reads connection details from EXPO_PUBLIC_* env vars (see .env.local),
 * which Expo inlines at build time — see
 * https://docs.expo.dev/versions/v57.0.0/guides/environment-variables/
 *
 * Auth sessions are persisted to AsyncStorage so a signed-in user stays
 * signed in across app restarts. `detectSessionInUrl` is disabled — magic
 * links are completed manually via `expo-linking` in `@/hooks/useAuth`
 * (`completeSessionFromUrl` in `@/services/authService`), the same way on
 * both web and native, so supabase-js doesn't also try to auto-parse the
 * redirect URL itself and race with that.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
  );
}

/**
 * True only during static web export/SSR (this module evaluated in Node,
 * not a browser). There's no `window` for AsyncStorage's web implementation
 * to read `localStorage` from, and no real user session to restore during a
 * build-time render anyway — GoTrueClient falls back to an in-memory store
 * when `persistSession` is false, which sidesteps that entirely.
 */
const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: !isServerRender,
    persistSession: !isServerRender,
    detectSessionInUrl: false,
  },
});
