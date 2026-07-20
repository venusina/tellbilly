import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';

import { MicGlyph } from '@/components/MicGlyph';
import { theme } from '@/theme';

export type RecordButtonState = 'idle' | 'listening' | 'processing' | 'disabled';

export interface RecordButtonProps {
  state: RecordButtonState;
  /** Tap-to-toggle interaction. Existing callers (e.g. JobCreationScreen) use this — leave it alone for them. */
  onPress?: () => void;
  /**
   * Press-and-hold interaction, for callers that want "hold to record,
   * release to finish" instead of tap-to-toggle. Optional and independent
   * of `onPress` — pass either, or both if a caller genuinely wants both
   * gestures on the same button (RN allows a Pressable to have both).
   */
  onPressIn?: () => void;
  onPressOut?: () => void;
  /** Diameter of the button itself, in dp. The pulsing ring extends beyond it. Defaults to 80 (the app's hero size). */
  size?: number;
}

const DEFAULT_SIZE = 80;

/** The app's hero interaction — press to start/stop a voice command. */
export function RecordButton({ state, onPress, onPressIn, onPressOut, size = DEFAULT_SIZE }: RecordButtonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'listening') {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [state, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  const isPressDisabled = state === 'disabled' || state === 'processing';

  return (
    <View style={[styles.wrap, { width: size * 1.8, height: size * 1.8 }]}>
      {state === 'listening' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isPressDisabled, busy: state === 'processing' }}
        disabled={isPressDisabled}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          state === 'disabled' && styles.disabled,
          pressed && !isPressDisabled && styles.pressed,
        ]}>
        {state === 'processing' ? (
          <ActivityIndicator color={theme.colors.text.inverse} />
        ) : (
          <MicGlyph color={theme.colors.text.inverse} size={size} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});
