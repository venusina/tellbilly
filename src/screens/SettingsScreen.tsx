import { StyleSheet, Text, View } from 'react-native';

import { NavHeader } from '@/components';
import { theme } from '@/theme';

/** Stub: account/business settings. Wire up to real preferences (invoice defaults, tax rate, profile) as they're built. */
export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <NavHeader title="Settings" />
      <View style={styles.body}>
        <Text style={styles.placeholderText}>Settings go here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  body: {
    flex: 1,
    padding: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
});
