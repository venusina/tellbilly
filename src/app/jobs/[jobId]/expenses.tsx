import { useLocalSearchParams } from 'expo-router';

import { ExpenseScreen } from '@/screens';

export default function JobExpensesRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  return <ExpenseScreen jobId={jobId} />;
}
