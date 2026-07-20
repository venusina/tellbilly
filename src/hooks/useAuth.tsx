/**
 * Auth context + useAuth hook
 *
 * Manages authentication state and provides magic-link sign-up/sign-in and
 * sign-out. Fully passwordless — see `@/services/authService` for the
 * send/receive halves of the magic-link flow.
 *
 * This is a context (not a plain hook with local state) because multiple
 * places in the tree need to see the SAME auth state: `_layout.tsx` reads
 * `user` to decide whether to render the signed-in app or the auth stack,
 * while the auth screens (signin/signup/etc.) are what actually change it.
 * A plain per-call `useState` would give each of those its own isolated
 * copy — signing in would update the signin screen's local state but
 * `_layout.tsx` would never find out. Mirrors `@/context/JobContext`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Linking from 'expo-linking';

import * as AuthService from '@/services/authService';
import { supabase } from '@/services/supabase';

export interface AuthUser {
  id: string;
  email: string;
  /**
   * From `user_metadata.full_name`/`name`, when present. Nothing in this
   * app's own passwordless sign-up collects a name today, so this is
   * usually absent — kept optional so callers (e.g. a greeting) can fall
   * back gracefully rather than assuming it's always there.
   */
  name?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial session check (on app launch) has resolved. */
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  /** The email a magic link was last sent to — shown on the check-your-email screen. */
  pendingEmail: string | null;
  /** True while a tapped magic link's URL is being exchanged for a session. */
  isCompletingSignIn: boolean;
  /** Set if that exchange fails — e.g. an expired or already-used link. */
  deepLinkError: string | null;
  signUpWithEmail: (email: string) => Promise<boolean>;
  signInWithEmail: (email: string) => Promise<boolean>;
  resendMagicLink: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

  // Single source of truth for `user`. Fires once immediately with whatever
  // session already exists (persisted from a previous launch, or none),
  // then again on every sign-in/sign-out — including a sign-in completed by
  // `completeSessionFromUrl` below when the user taps their magic link, so
  // that path doesn't need to separately update `user` itself.
  useEffect(() => {
    let initialized = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? '',
              name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
            }
          : null
      );
      if (!initialized) {
        initialized = true;
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Completes sign-in when the app is opened via the tapped magic link —
  // both cold-start (app wasn't running yet) and while already running.
  useEffect(() => {
    async function complete(url: string) {
      setIsCompletingSignIn(true);
      setDeepLinkError(null);
      const result = await AuthService.completeSessionFromUrl(url);
      setIsCompletingSignIn(false);
      if (!result.success) {
        setDeepLinkError(result.error ?? 'This link is invalid or has expired.');
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) complete(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      complete(url);
    });

    return () => subscription.remove();
  }, []);

  const signUpWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AuthService.sendMagicLink(email, true);
      if (!result.success) {
        setError(result.error ?? 'Failed to send magic link');
        return false;
      }
      setPendingEmail(email);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AuthService.sendMagicLink(email, false);
      if (!result.success) {
        setError(result.error ?? 'Failed to send magic link');
        return false;
      }
      setPendingEmail(email);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendMagicLink = useCallback(async () => {
    if (!pendingEmail) {
      setError('No pending sign-in to resend');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      // By the time there's a pendingEmail, the account already exists if
      // this was a sign-up — signInWithOtp creates it server-side on the
      // first call, independent of whether the email itself ever arrives —
      // so `shouldCreateUser: false` is always correct/safe on resend.
      const result = await AuthService.sendMagicLink(pendingEmail, false);
      if (!result.success) {
        setError(result.error ?? 'Failed to resend magic link');
        return false;
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [pendingEmail]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AuthService.signOut();
      if (!result.success) {
        setError(result.error ?? 'Sign out failed');
        return false;
      }
      setPendingEmail(null);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      isLoading,
      error,
      pendingEmail,
      isCompletingSignIn,
      deepLinkError,
      signUpWithEmail,
      signInWithEmail,
      resendMagicLink,
      signOut,
    }),
    [
      user,
      isInitializing,
      isLoading,
      error,
      pendingEmail,
      isCompletingSignIn,
      deepLinkError,
      signUpWithEmail,
      signInWithEmail,
      resendMagicLink,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
