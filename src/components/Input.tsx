import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, type IconName } from './Icon';

import { theme } from '@/theme';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  icon?: IconName;
  /** Forces the focused/active visual state on, regardless of real focus. */
  isActive?: boolean;
  disabled?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  /** Masks input text, e.g. for passwords. Matches TextInput's native prop name. */
  secureTextEntry?: boolean;
  /** Rendered at the right edge of the field — e.g. a show/hide password toggle. */
  rightElement?: ReactNode;
}

const HEIGHT = 52;

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  isActive = false,
  disabled = false,
  keyboardType,
  autoCapitalize,
  maxLength,
  secureTextEntry,
  rightElement,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const active = isActive || focused;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          active && styles.fieldActive,
          disabled && styles.disabled,
        ]}>
        {icon && (
          <Icon
            name={icon}
            size={18}
            color={active ? theme.colors.accent.primary : theme.colors.text.secondary}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.secondary}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.primary,
  },
  field: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.background.primary,
  },
  fieldActive: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.primary,
  },
});
