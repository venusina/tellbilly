import { StyleSheet, Text, type ColorValue } from 'react-native';

/**
 * Minimal, dependency-free icon set. Renders a glyph as styled `Text` rather
 * than pulling in an icon font/SVG library — keeps the component library
 * free of external UI dependencies per the design-system brief.
 */
const GLYPHS = {
  'arrow-right': '→',
  sparkle: '✦',
  plus: '+',
  phone: '☎',
  star: '★',
  check: '✓',
  home: '⌂',
  jobs: '▤',
  invoice: '$',
  settings: '⚙',
  'chevron-left': '‹',
  close: '✕',
  menu: '☰',
} as const;

export type IconName = keyof typeof GLYPHS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

export function Icon({ name, size = 18, color }: IconProps) {
  return (
    <Text
      style={[styles.glyph, { fontSize: size, lineHeight: size, color }]}
      allowFontScaling={false}>
      {GLYPHS[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
