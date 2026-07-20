import { StyleSheet, Text, View } from 'react-native';

import { NavHeader } from '@/components';
import { theme } from '@/theme';

/** Stub: lists invoices across jobs. Wire up to `useInvoice().fetchInvoices` once a job/invoice list query exists. */
export function InvoiceScreen() {
  return (
    <View style={styles.container}>
      <NavHeader title="Invoices" />
      <View style={styles.body}>
        <Text style={styles.emptyText}>No invoices yet.</Text>
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
