import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, MicGlyph, type IconName } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

// Screen-specific "assistant" purple — close to but distinct from
// theme.colors.accent.primary (#5246d4), and not used anywhere else yet, so
// it's kept local rather than added to the shared theme.
const ASSISTANT_PURPLE = '#4648d4';
const ASSISTANT_PURPLE_RGB = '70, 72, 212';

// Header band's dark navy is a near-match for theme.colors.primary[800]
// (#141b2b) but not identical to Figma's #1a1f2b — kept as the exact
// ground-truth value rather than snapped to the closest existing token.
const HEADER_BACKGROUND = '#1a1f2b';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function HamburgerIcon() {
  return (
    <View style={styles.hamburger}>
      <View style={styles.hamburgerBar} />
      <View style={styles.hamburgerBar} />
      <View style={styles.hamburgerBar} />
    </View>
  );
}

interface NavItemConfig {
  key: string;
  label: string;
  icon: IconName;
  href: '/home' | '/jobs' | '/invoices' | '/settings';
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/home' },
  { key: 'jobs', label: 'Jobs', icon: 'jobs', href: '/jobs' },
  { key: 'financials', label: 'Financials', icon: 'invoice', href: '/invoices' },
  { key: 'settings', label: 'Setting', icon: 'settings', href: '/settings' },
];

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const greeting = user?.name ? `${getGreeting()} ${user.name}!` : `${getGreeting()}!`;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={12}
            onPress={() => {
              // No menu/drawer built yet — placeholder for later.
            }}>
            <HamburgerIcon />
          </Pressable>
          <Text style={styles.wordmark}>TellBilly</Text>
          {/* Balances the hamburger's width so the wordmark centers in the remaining space. */}
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentInner}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>{greeting}</Text>

          <Pressable
            style={({ pressed }) => [styles.instructionPill, pressed && styles.pressed]}
            onPress={() => {
              // No instructions content built yet — placeholder for later.
            }}>
            <Text style={styles.instructionPillText}>Press for instructions</Text>
          </Pressable>

          <View style={styles.micArea}>
            <View style={styles.micGlow} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hold to start voice command"
              style={({ pressed }) => [styles.micButton, pressed && styles.micButtonPressed]}
              onPressIn={() => {
                // Press-and-hold, not tap-to-toggle: navigating on press-down
                // (not press-release) is what makes it *feel* like holding
                // starts recording immediately, the way voice-memo/walkie
                // style interactions work. VoiceConversationScreen enters
                // its "listening" phase as soon as it mounts.
                router.push('/voice');
              }}>
              <MicGlyph color={theme.colors.text.inverse} size={60} />
            </Pressable>
          </View>

          {/* Hidden for now — likely a "tap to speak" state label once recording is wired up. */}
          <Text style={styles.hiddenStateLabel}>TAP TO SPEAK</Text>

          <Text style={styles.statusText}>Billy is ready to help</Text>
        </View>

        <Text style={styles.welcomeCopy}>
          Welcome to ChatBilly. I can help you creating projects, quote, invoices and add expenses
          just by talking to me
        </Text>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, theme.spacing[3]) }]}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === 'home';
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={styles.navItem}
              onPress={() => router.push(item.href)}>
              <View style={[styles.navItemInner, active && styles.navItemActive]}>
                <Icon
                  name={item.icon}
                  size={18}
                  color={active ? theme.colors.text.inverse : '#464554'}
                />
                <Text style={[styles.navLabel, active ? styles.navLabelActive : styles.navLabelInactive]}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HEADER_BACKGROUND,
  },
  headerSafeArea: {
    backgroundColor: HEADER_BACKGROUND,
  },
  header: {
    height: 77,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  hamburger: {
    width: 18,
    height: 12,
    justifyContent: 'space-between',
  },
  hamburgerBar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.text.inverse,
  },
  headerSpacer: {
    width: 18,
  },
  wordmark: {
    flex: 1,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: theme.colors.text.inverse,
  },
  mainContent: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  mainContentInner: {
    paddingTop: theme.spacing[5],
    paddingHorizontal: 20,
    gap: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
  heroSection: {
    alignItems: 'center',
    gap: 13,
  },
  greeting: {
    fontSize: 19,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  instructionPill: {
    backgroundColor: `rgba(${ASSISTANT_PURPLE_RGB}, 0.05)`,
    borderWidth: 1,
    borderColor: `rgba(${ASSISTANT_PURPLE_RGB}, 0.2)`,
    borderRadius: theme.radius.full,
    paddingHorizontal: 17,
    paddingVertical: 7,
  },
  pressed: {
    opacity: 0.7,
  },
  instructionPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#464554',
  },
  micArea: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micGlow: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: theme.colors.background.primary,
    opacity: 0.7,
    shadowColor: theme.colors.background.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
  },
  micButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[800],
    shadowColor: ASSISTANT_PURPLE,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 12,
  },
  micButtonPressed: {
    opacity: 0.9,
  },
  hiddenStateLabel: {
    opacity: 0,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: ASSISTANT_PURPLE,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: ASSISTANT_PURPLE,
    textAlign: 'center',
  },
  welcomeCopy: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 32,
    color: '#030611',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(198, 198, 204, 0.2)',
    paddingTop: theme.spacing[3],
    paddingHorizontal: theme.spacing[2],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.radius.lg,
    minWidth: 64,
  },
  navItemActive: {
    backgroundColor: '#030611',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  navLabelActive: {
    color: theme.colors.text.inverse,
  },
  navLabelInactive: {
    color: '#464554',
    opacity: 0.6,
  },
});
