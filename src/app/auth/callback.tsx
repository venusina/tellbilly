/**
 * Deep-link landing route for the magic link's `emailRedirectTo`.
 *
 * Not a real destination — `useAuth`'s Linking listener processes the URL
 * (that's what actually completes sign-in) regardless of whether this route
 * ever renders. This just exists so there's something reasonable on screen
 * for the moment in between: a loading state while that's in flight, or a
 * way back if the link turned out to be invalid/expired. On success,
 * `_layout.tsx` swaps to the signed-in app automatically once `user`
 * updates — no navigation needed from here.
 */

import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isCompletingSignIn, deepLinkError } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {deepLinkError ? (
          <>
            <Text style={styles.title}>That link didn't work</Text>
            <Text style={styles.description}>{deepLinkError}</Text>
            <Button
              label="Back to sign in"
              variant="secondary"
              onPress={() => router.replace('/(auth)/signin')}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.colors.accent.primary} />
            <Text style={styles.description}>
              {isCompletingSignIn ? 'Signing you in…' : 'One moment…'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[3],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing[4],
  },
});
