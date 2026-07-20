/**
 * Auth Stack Layout
 *
 * Defines the navigation structure for auth screens.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="check-email" />
      <Stack.Screen name="signin" />
    </Stack>
  );
}
