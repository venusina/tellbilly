/**
 * SignupScreen
 *
 * Screen 1 of the passwordless sign-up flow: user enters their email and
 * we send them a magic link. No password, no code to type — see
 * check-email.tsx for what comes next.
 */

import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, NavHeader } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signUpWithEmail, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email');
      return;
    }

    const success = await signUpWithEmail(email);
    if (success) {
      router.push('/(auth)/check-email');
    } else {
      setLocalError(error || 'Failed to send magic link');
    }
  }, [email, signUpWithEmail, error, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <NavHeader title="Create account" onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add your email</Text>
          <Text style={styles.description}>
            We'll email you a secure sign-in link — no password needed.
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
            onPress={handleContinue}
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
