/**
 * Design tokens for TellBilly.
 *
 * Palette and type scale follow Google's Material Design guidelines
 * (https://m3.material.io/styles/color, https://m3.material.io/styles/typography)
 * adapted to this app's brand color. This is a separate, app-specific token
 * set from `@/constants/theme` (the Expo template's light/dark scheme) —
 * components that want Material-style tokens (buttons, cards, forms) should
 * import from here.
 */

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export const Colors = {
  primary: '#6366f1',

  neutral: {
    white: '#ffffff',
    50: '#f3f4f6',
    100: '#e5e7eb',
    300: '#9ca3af',
    500: '#6b7280',
    700: '#1f2937',
    900: '#111827',
  },

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

/**
 * Semantic aliases, so components describe intent ("surface", "border")
 * rather than reaching into the raw neutral scale.
 */
export const Semantic = {
  background: Colors.neutral.white,
  surface: Colors.neutral[50],
  border: Colors.neutral[100],
  textPrimary: Colors.neutral[900],
  textSecondary: Colors.neutral[700],
  textMuted: Colors.neutral[500],
  textDisabled: Colors.neutral[300],
  onPrimary: Colors.neutral.white,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * A trimmed Material Design type scale — the roles most apps actually use.
 * fontSize/lineHeight are in dp (React Native's density-independent unit).
 */
export const Typography = {
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' },

  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' },

  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },

  label: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' }>;

export type TypographyVariant = keyof typeof Typography;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

/** 4dp base unit, following Material's 8dp grid (with a 4dp half-step). */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof Spacing;

// ---------------------------------------------------------------------------
// Shape & elevation
// ---------------------------------------------------------------------------

export const Radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

/**
 * Material-style elevation, expressed as React Native shadow props.
 * `elevation` covers Android; the `shadow*` props cover iOS/web.
 */
export const Elevation = {
  level0: { elevation: 0, shadowOpacity: 0 },
  level1: {
    elevation: 1,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  level2: {
    elevation: 3,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
} as const;

export const Theme = {
  colors: Colors,
  semantic: Semantic,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  elevation: Elevation,
} as const;

export type AppTheme = typeof Theme;
