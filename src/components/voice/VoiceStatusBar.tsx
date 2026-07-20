import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export type VoiceStatus = 'listening' | 'processing' | 'error' | 'idle';

export interface VoiceStatusBarProps {
  status: VoiceStatus;
  errorMessage?: string;
  onRetry?: () => void;
}

/** A slim strip reflecting the current voice-pipeline state. Renders nothing when idle. */
export function VoiceStatusBar({ status, errorMessage, onRetry }: VoiceStatusBarProps) {
  if (status === 'idle') return null;

  return (
    <View style={styles.container}>
      {status === 'listening' && (
        <View style={styles.row}>
          <Text style={styles.text}>Listening</Text>
          <AnimatedDots />
        </View>
      )}

      {status === 'processing' && (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={theme.colors.accent.primary} />
          <Text style={styles.text}>Billy is thinking…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText} numberOfLines={2}>
            {errorMessage ?? 'Something went wrong.'}
          </Text>
          {onRetry && (
            <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
              {({ pressed }) => <Text style={[styles.retryText, pressed && styles.retryTextPressed]}>Try again</Text>}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function AnimatedDots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, index) => (
        <Animated.View key={index} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  text: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    color: theme.colors.text.secondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent.primary,
  },
  errorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.status.error,
  },
  retryText: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.accent.primary,
  },
  retryTextPressed: {
    opacity: 0.7,
  },
});
