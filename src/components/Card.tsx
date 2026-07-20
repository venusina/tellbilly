import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './Icon';

import { theme } from '@/theme';

export type CardVariant = 'selection' | 'info' | 'upload';

export interface CardProps {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  children?: ReactNode;
}

export function Card({
  variant = 'info',
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
  children,
}: CardProps) {
  const body = (
    <>
      {icon && (
        <View style={styles.iconWrap}>
          <Icon
            name={icon}
            size={20}
            color={selected ? theme.colors.accent.primary : theme.colors.text.secondary}
          />
        </View>
      )}
      {(title || subtitle) && (
        <View style={styles.textWrap}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </>
  );

  if (variant === 'selection') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.selection,
          selected && styles.selectionActive,
          pressed && styles.pressed,
        ]}>
        {body}
      </Pressable>
    );
  }

  if (variant === 'upload') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.base, styles.upload, pressed && styles.pressed]}>
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.base, styles.info]}>{body}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
  },
  info: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.elevation.level1,
  },
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  selectionActive: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.background.secondary,
  },
  upload: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    minHeight: 140,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.secondary,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
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
});
