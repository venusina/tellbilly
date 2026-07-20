/**
 * SignInScreen
 *
 * Passwordless login: enter your email, get a magic link. Same underlying
 * mechanism as sign-up (see @/hooks/useAuth), except `shouldCreateUser` is
 * false here — this form only signs in existing accounts.
 */

import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, NavHeader } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signInWithEmail, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email');
      return;
    }

    const success = await signInWithEmail(email);
    if (success) {
      router.push('/(auth)/check-email');
    } else {
      setLocalError(error || 'Failed to send magic link');
    }
  }, [email, signInWithEmail, error, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <NavHeader title="Sign in" onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>
            Enter your email and we'll send you a sign-in link.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
          />

          {(localError || error) && (
            <Text style={styles.errorText}>{localError || error}</Text>
          )}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            label="Send magic link"
            onPress={handleSignIn}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  form: {
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.status.error,
  },
  cta: {
    marginTop: 'auto',
  },
});
