import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export interface TranscriptDisplayProps {
  /** Not-yet-finalized text from the recognizer — shown dimmed, may still change. */
  interimText?: string;
  /** Settled, won't-change text. */
  finalText?: string;
  isListening?: boolean;
  /**
   * 'light' (default): boxed card on a light background — the original look,
   * used e.g. in JobCreationScreen.
   * 'dark': bare white-on-black text with no card, for a full-screen dark
   * takeover (e.g. VoiceConversationScreen) — large text sitting directly on
   * the screen's own background rather than in its own surface.
   */
  variant?: 'light' | 'dark';
}

/** Real-time transcription area: settled text in full color, in-flight text dimmed. */
export function TranscriptDisplay({
  interimText = '',
  finalText = '',
  isListening = false,
  variant = 'light',
}: TranscriptDisplayProps) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const isEmpty = !interimText && !finalText;
  const isDark = variant === 'dark';

  useEffect(() => {
    if (!isListening) {
      cursorOpacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0.15, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isListening, cursorOpacity]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {isEmpty ? (
        <Text style={[styles.placeholder, isDark && styles.placeholderDark]}>
          Tap the mic and tell Billy what you need…
        </Text>
      ) : (
        <Text style={[styles.text, isDark && styles.textDark]}>
          {finalText ? (
            <Text style={isDark ? styles.finalTextDark : styles.finalText}>{finalText}</Text>
          ) : null}
          {finalText && interimText ? ' ' : null}
          {interimText ? (
            <Text style={isDark ? styles.interimTextDark : styles.interimText}>{interimText}</Text>
          ) : null}
          {isListening ? (
            <Animated.Text style={[isDark ? styles.cursorDark : styles.cursor, { opacity: cursorOpacity }]}>
              {' '}
              ▍
            </Animated.Text>
          ) : null}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 96,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    justifyContent: 'center',
  },
  containerDark: {
    minHeight: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    justifyContent: 'flex-start',
  },
  placeholder: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
  placeholderDark: {
    fontSize: 28,
    lineHeight: 36,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  text: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  textDark: {
    fontSize: 28,
    lineHeight: 36,
  },
  finalText: {
    color: theme.colors.text.primary,
  },
  finalTextDark: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  interimText: {
    color: theme.colors.text.secondary,
    opacity: 0.7,
  },
  interimTextDark: {
    color: theme.colors.text.inverse,
    opacity: 0.6,
    fontWeight: '600',
  },
  cursor: {
    color: theme.colors.accent.primary,
  },
  cursorDark: {
    color: theme.colors.text.inverse,
  },
});
