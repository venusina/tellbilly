import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';

import { theme } from '@/theme';

export interface SelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
}

/** A compact, single-choice list row — e.g. picking a payment method or job type. */
export function SelectionCard({ title, subtitle, icon, selected = false, onPress }: SelectionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.pressed,
      ]}>
      {icon && (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Icon
            name={icon}
            size={18}
            color={selected ? theme.colors.text.inverse : theme.colors.text.secondary}
          />
        </View>
      )}

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.primary,
  },
  containerSelected: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  iconWrapSelected: {
    backgroundColor: theme.colors.accent.primary,
  },
  textWrap: {
    flex: 1,
    gap: theme.spacing[1],
  },
  title: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.accent.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.primary,
  },
});
