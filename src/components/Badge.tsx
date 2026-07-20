import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export type BadgeVariant = 'filled' | 'outlined';
export type BadgeTone = 'accent' | 'success' | 'warning' | 'error';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Color family. Defaults to the brand accent; use 'warning'/'error'/'success' for status badges. */
  tone?: BadgeTone;
}

const TONE_COLOR: Record<BadgeTone, string> = {
  accent: theme.colors.accent.primary,
  success: theme.colors.status.success,
  warning: theme.colors.status.warning,
  error: theme.colors.status.error,
};

export function Badge({ label, variant = 'filled', tone = 'accent' }: BadgeProps) {
  const color = TONE_COLOR[tone];

  return (
    <View
      style={[
        styles.base,
        variant === 'filled' ? { backgroundColor: color } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
      ]}>
      <Text style={[styles.label, { color: variant === 'filled' ? theme.colors.text.inverse : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  label: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
  },
});
