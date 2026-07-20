import { Stack } from 'expo-router';

/** Stack for the Jobs tab: list -> create -> per-job expenses. Screens render their own NavHeader. */
export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[jobId]/expenses" />
    </Stack>
  );
}
