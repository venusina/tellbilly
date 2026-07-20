/**
 * Supabase Auth Service
 *
 * Fully passwordless: sign-up and sign-in are both a magic link sent to the
 * user's email via `signInWithOtp`. `shouldCreateUser` is the only thing
 * that distinguishes them — true for sign-up (creates an account if one
 * doesn't exist), false for sign-in (only signs in an existing account,
 * so the sign-in form can't be used to silently create new ones).
 *
 * Tapping the emailed link opens the app via a deep link (see
 * `completeSessionFromUrl`, wired up in `@/hooks/useAuth`) rather than the
 * user typing anything back in — there's no OTP-code entry and no password
 * to reset.
 */

import * as Linking from 'expo-linking';

import { supabase } from './supabase';

export interface AuthState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Sends a magic sign-in link to `email`.
 * `shouldCreateUser: true` for sign-up (create the account if needed),
 * `false` for sign-in (existing accounts only) and for resending.
 */
export async function sendMagicLink(email: string, shouldCreateUser: boolean) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
        // Computed here (call time), not at module scope — this touches
        // platform/window state that isn't available during static web
        // export's server-side render pass.
        emailRedirectTo: Linking.createURL('auth/callback'),
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send magic link',
    };
  }
}

/**
 * Completes sign-in from the URL that opened the app after the user tapped
 * their magic link. Supports both the PKCE (`?code=`) and implicit
 * (`#access_token=&refresh_token=`) flows, since either could be in play
 * depending on the Supabase project's auth settings.
 *
 * Establishing the session here is enough on its own — `useAuth`'s
 * `onAuthStateChange` subscription picks up the resulting session and
 * updates `user`, so callers don't need to do anything with the result.
 */
export async function completeSessionFromUrl(url: string) {
  try {
    const { queryParams } = Linking.parse(url);
    const code = queryParams?.code;

    if (typeof code === 'string') {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return { success: true };
    }

    const fragment = url.split('#')[1];
    if (!fragment) return { success: false, error: 'No session data in URL' };

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      return { success: false, error: 'No session data in URL' };
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to complete sign-in',
    };
  }
}

/**
 * Sign out current user.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign out failed',
    };
  }
}
