import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './Icon';

import { theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'large';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner in place of the label and disables press, e.g. while an async action is in flight. */
  loading?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ButtonSize, number> = {
  large: 56,
};

export function Button({
  label,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  onPress,
  icon,
  style,
}: ButtonProps) {
  const iconOnLeft = variant === 'ghost';
  const isPressDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isPressDisabled, busy: loading }}
      disabled={isPressDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size] },
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !isPressDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <View style={styles.content}>
          {icon && iconOnLeft && <Icon name={icon} size={16} color={textColor[variant]} />}
          <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
          {icon && !iconOnLeft && <Icon name={icon} size={16} color={textColor[variant]} />}
        </View>
      )}
    </Pressable>
  );
}

const textColor: Record<ButtonVariant, string> = {
  primary: theme.colors.text.inverse,
  secondary: theme.colors.primary[800],
  ghost: theme.colors.accent.primary,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.typography.button.fontSize,
    lineHeight: theme.typography.button.lineHeight,
    fontWeight: theme.typography.button.fontWeight,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary[800],
  },
  secondary: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
