import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../Badge';
import { Button } from '../Button';

import { theme } from '@/theme';

export interface ConfirmationField {
  label: string;
  value: string;
}

export interface ConfirmationCardProps {
  title: string;
  fields: ConfirmationField[];
  onConfirm: () => void;
  onEdit: () => void;
  /** Shows a warning badge when the parsed command is low-confidence and worth double-checking. */
  needsReview?: boolean;
}

/** Shown after a voice command is parsed, so the user can confirm the extracted details before it's applied. */
export function ConfirmationCard({ title, fields, onConfirm, onEdit, needsReview = false }: ConfirmationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {needsReview && <Badge label="Please review" tone="warning" />}
      </View>

      <View style={styles.fields}>
        {fields.map((field) => (
          <View key={field.label} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Edit" variant="ghost" onPress={onEdit} style={styles.editButton} />
        <Button label="Confirm" variant="primary" onPress={onConfirm} style={styles.confirmButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    gap: theme.spacing[4],
    ...theme.elevation.level2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.primary,
  },
  fields: {
    gap: theme.spacing[3],
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  fieldLabel: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    color: theme.colors.text.secondary,
  },
  fieldValue: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  editButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
