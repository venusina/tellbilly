import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { NavHeader } from '@/components';
import { theme } from '@/theme';

export interface ExpenseScreenProps {
  jobId: string;
}

/** Stub: lists/adds expenses for a job. Wire up to `useExpense().fetchExpenses(jobId)` once the list UI exists. */
export function ExpenseScreen({ jobId }: ExpenseScreenProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader title="Expenses" onBackPress={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.emptyText}>No expenses yet for job {jobId}.</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
});
