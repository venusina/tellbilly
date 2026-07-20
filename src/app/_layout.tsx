import { DarkTheme, DefaultTheme, Stack, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Icon } from '@/components/Icon';
import { ConversationProvider } from '@/context/ConversationContext';
import { JobProvider } from '@/context/JobContext';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ErrorBoundary>
        <AuthProvider>
          <JobProvider>
            <ConversationProvider>
              <RootNavigation />
            </ConversationProvider>
          </JobProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

/** Split out from RootLayout so it can read `useAuth()`, which needs AuthProvider above it. */
function RootNavigation() {
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    // Wait until the initial session check resolves either way — hiding as
    // soon as we know the real auth state, not only when there's a user.
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {
        // Can reject if the native splash was already dismissed — nothing to
        // recover from, just don't let it surface as an unhandled rejection.
      });
    }
  }, [isInitializing]);

  return (
    <>
      <AnimatedSplashOverlay />
      {isInitializing ? (
        // Session check still in flight — avoid flashing the auth stack for
        // an already-signed-in user. AnimatedSplashOverlay still covers this
        // visually for its own ~600ms, but sessions can take longer to
        // resolve than that, so this is what's left showing once it's done.
        <View style={styles.loadingContainer} />
      ) : user ? (
        // User is authenticated — show app
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.accent.primary,
            tabBarInactiveTintColor: theme.colors.text.secondary,
          }}>
          {/* Expo template demo screens — kept, but hidden from the product tab bar. */}
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="explore" options={{ href: null }} />

          {/*
            The real landing screen (see src/screens/HomeScreen.tsx). It draws
            its own full-width bottom nav per the Figma spec, so the native
            tab bar is hidden while it's focused (tabBarStyle: display:none)
            to avoid stacking two bottom bars — it reappears normally once the
            user navigates to jobs/invoices/settings below.
          */}
          <Tabs.Screen name="home" options={{ href: null, tabBarStyle: { display: 'none' } }} />

          {/* Full-screen black voice takeover (see src/screens/VoiceConversationScreen.tsx) — same tab-bar hiding treatment as home. */}
          <Tabs.Screen name="voice" options={{ href: null, tabBarStyle: { display: 'none' } }} />

          <Tabs.Screen
            name="jobs"
            options={{
              title: 'Jobs',
              tabBarIcon: ({ color, size }) => <Icon name="jobs" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="invoices"
            options={{
              title: 'Invoices',
              tabBarIcon: ({ color, size }) => <Icon name="invoice" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color} />,
            }}
          />
        </Tabs>
      ) : (
        // User is not authenticated — show auth stack
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        </Stack>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});
