/**
 * WelcomeScreen
 *
 * First screen of auth flow: brand intro + call to action.
 */

import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { theme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Brand section */}
        <View style={styles.brandSection}>
          {/* Logo placeholder — replace with your TellBilly logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🧾</Text>
          </View>

          <Text style={styles.appName}>TellBilly</Text>
          <Text style={styles.tagline}>Voice-first invoicing for service professionals</Text>
        </View>

        {/* Call to action */}
        <View style={styles.ctaSection}>
          <Button onPress={handleContinue} label="Continue with email" />

          {/* Sign in link */}
          <View style={styles.signInPrompt}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Text
              style={styles.signInLink}
              onPress={() => router.push('/(auth)/signin')}
            >
              Sign in
            </Text>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
  brandSection: {
    alignItems: 'center',
    marginTop: theme.spacing[6],
  },
  logoContainer: {
    marginBottom: theme.spacing[5],
  },
  logoText: {
    fontSize: 64,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  ctaSection: {
    gap: theme.spacing[4],
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
});
