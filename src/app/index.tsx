import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

/**
 * Root route ("/"). Not a real screen — expo-router always resolves "/" to
 * this file regardless of tab-bar visibility (hiding a Tabs.Screen via
 * `href: null` only removes its tab-bar button, it doesn't stop "/" from
 * rendering this file's content). So this just redirects to wherever the
 * user actually belongs, based on auth state.
 */
export default function Index() {
  const { user, isInitializing } = useAuth();

  // Auth state not resolved yet — RootNavigation (src/app/_layout.tsx)
  // already shows a loading view in this window, so render nothing rather
  // than guess and redirect to the wrong place.
  if (isInitializing) return null;

  return <Redirect href={user ? '/home' : '/(auth)/welcome'} />;
}
