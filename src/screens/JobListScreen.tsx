import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, NavHeader } from '@/components';
import { theme } from '@/theme';

/** Stub: lists jobs for the signed-in user. Wire up to `useJob`/`fetchJob` once the list query exists. */
export function JobListScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader title="Jobs" />
      <View style={styles.body}>
        <Text style={styles.emptyText}>No jobs yet.</Text>
        <Button label="New Job" icon="plus" onPress={() => router.push('/jobs/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  body: {
    flex: 1,
    padding: theme.spacing[4],
    gap: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
});
