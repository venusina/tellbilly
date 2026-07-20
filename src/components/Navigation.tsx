import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './Icon';

import { theme } from '@/theme';

// ---------------------------------------------------------------------------
// NavHeader
// ---------------------------------------------------------------------------

export type NavHeaderVariant = 'simple' | 'steps';

export interface NavHeaderProps {
  variant?: NavHeaderVariant;
  title: string;
  step?: number;
  totalSteps?: number;
  onBackPress?: () => void;
  cancelLabel?: string;
}

export function NavHeader({
  variant = 'simple',
  title,
  step,
  totalSteps,
  onBackPress,
  cancelLabel = 'Cancel',
}: NavHeaderProps) {
  const showSteps = variant === 'steps' && !!step && !!totalSteps;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {onBackPress && (
          <Pressable accessibilityRole="button" onPress={onBackPress} hitSlop={8}>
            {variant === 'simple' ? (
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            ) : (
              <Icon name="close" size={16} color={theme.colors.text.secondary} />
            )}
          </Pressable>
        )}
      </View>

      {showSteps && (
        <>
          <Text style={styles.stepLabel}>
            Step {step} of {totalSteps}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (step! / totalSteps!) * 100)}%` },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

export interface TabBarItem {
  key: string;
  label: string;
  icon: IconName;
}

export interface TabBarProps {
  items?: TabBarItem[];
  activeIndex: number;
  onItemPress: (index: number) => void;
}

const DEFAULT_ITEMS: TabBarItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'jobs', label: 'Jobs', icon: 'star' },
  { key: 'done', label: 'Done', icon: 'check' },
  { key: 'invoices', label: 'Invoices', icon: 'invoice' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export function TabBar({ items = DEFAULT_ITEMS, activeIndex, onItemPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: theme.spacing[2] + insets.bottom }]}>
      {items.map((item, index) => {
        const active = index === activeIndex;
        const color = active ? theme.colors.accent.primary : theme.colors.text.secondary;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onItemPress(index)}
            style={styles.tabItem}>
            <Icon name={item.icon} size={20} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.background.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text.primary,
  },
  cancelLabel: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
  stepLabel: {
    fontSize: theme.typography.label.fontSize,
    lineHeight: theme.typography.label.lineHeight,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.secondary,
  },
  progressTrack: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border.default,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.primary,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.spacing[2],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
});
