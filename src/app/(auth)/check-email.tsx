/**
 * CheckEmailScreen
 *
 * Screen 2 of the passwordless flow: confirms the magic link was sent and
 * lets the user resend it. There's nothing to type here — tapping the link
 * in the email completes sign-in (see `completeSessionFromUrl` in
 * `@/services/authService`, wired up in `@/hooks/useAuth`), and the app
 * navigates itself to the signed-in area once that happens.
 */

import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavHeader } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function CheckEmailScreen() {
  const router = useRouter();
  const { pendingEmail, resendMagicLink, isLoading, error } = useAuth();
  const [resendConfirmation, setResendConfirmation] = useState<string | null>(null);

  const handleResend = useCallback(async () => {
    setResendConfirmation(null);
    const success = await resendMagicLink();
    if (success) {
      setResendConfirmation('Sent! Check your inbox.');
    }
  }, [resendMagicLink]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <NavHeader title="Check your email" onBackPress={() => router.back()} />

      <View style={styles.container}>
        <Text style={styles.icon}>📬</Text>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.description}>
          We sent a sign-in link to{' '}
          <Text style={styles.bold}>{pendingEmail ?? 'your email'}</Text>. Tap it to continue —
          this screen will move on automatically.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {resendConfirmation && <Text style={styles.confirmationText}>{resendConfirmation}</Text>}

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't get it? </Text>
          <Text style={styles.resendLink} onPress={isLoading ? undefined : handleResend}>
            {isLoading ? 'Sending…' : 'Resend'}
          </Text>
        </View>
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
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  bold: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.status.success,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  resendText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
});
