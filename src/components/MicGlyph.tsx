import { StyleSheet, View, type ColorValue } from 'react-native';

export interface MicGlyphProps {
  color: ColorValue;
  /** Drives every dimension proportionally — this isn't a traced icon, just a tintable approximation. */
  size: number;
}

/** A minimal microphone shape built from Views — kept tintable via `color`, unlike an emoji glyph. */
export function MicGlyph({ color, size }: MicGlyphProps) {
  const bodyWidth = size * 0.28;
  const bodyHeight = size * 0.4;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View
        style={[
          styles.body,
          { width: bodyWidth, height: bodyHeight, borderRadius: bodyWidth / 2, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.stand,
          { width: bodyWidth * 1.7, height: bodyWidth * 1.1, borderColor: color, borderRadius: bodyWidth },
        ]}
      />
      <View style={[styles.base, { width: size * 0.05, height: size * 0.1, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {},
  stand: {
    borderWidth: 2,
    borderTopWidth: 0,
    marginTop: 3,
  },
  base: {
    marginTop: 2,
    borderRadius: 2,
  },
});
