import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

export interface WaveformProps {
  isActive: boolean;
  /** Number of bars, clamped to 5-7. Defaults to 5. */
  barCount?: number;
  color?: string;
}

const MIN_BAR_COUNT = 5;
const MAX_BAR_COUNT = 7;
const IDLE_HEIGHT_RATIO = 0.25;
const BAR_WIDTH = 4;
const BAR_GAP = 4;
const CONTAINER_HEIGHT = 32;

/** Lightweight live-audio look: looping height animations, no real audio analysis. */
export function Waveform({ isActive, barCount = MIN_BAR_COUNT, color }: WaveformProps) {
  const clampedCount = Math.min(MAX_BAR_COUNT, Math.max(MIN_BAR_COUNT, barCount));
  const heights = useRef(
    Array.from({ length: clampedCount }, () => new Animated.Value(IDLE_HEIGHT_RATIO))
  ).current;

  useEffect(() => {
    if (!isActive) {
      heights.forEach((value) => value.setValue(IDLE_HEIGHT_RATIO));
      return;
    }

    const animations = heights.map((value, index) => {
      // Vary each bar's peak so the row doesn't move in lockstep.
      const peak = 0.55 + (index % 3) * 0.15;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 90),
          Animated.timing(value, { toValue: peak, duration: 280, useNativeDriver: false }),
          Animated.timing(value, { toValue: IDLE_HEIGHT_RATIO, duration: 280, useNativeDriver: false }),
        ])
      );
    });

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [isActive, heights]);

  const barColor = color ?? (isActive ? theme.colors.accent.primary : theme.colors.border.strong);

  return (
    <View style={styles.container}>
      {heights.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: barColor,
              height: value.interpolate({ inputRange: [0, 1], outputRange: [0, CONTAINER_HEIGHT] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CONTAINER_HEIGHT,
  },
  bar: {
    width: BAR_WIDTH,
    marginHorizontal: BAR_GAP / 2,
    borderRadius: BAR_WIDTH / 2,
  },
});
