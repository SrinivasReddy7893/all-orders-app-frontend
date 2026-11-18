import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '@/config/env';
import { colors, typography } from '@/theme';

/** Touch area grows to ~48dp tall without adding visible space. */
const SLOP = { top: 16, bottom: 16, left: 6, right: 6 };

function InlineLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Opens in your browser"
      hitSlop={SLOP}
      onPress={() => Linking.openURL(url)}
    >
      {({ pressed }) => (
        <Text style={[styles.text, styles.link, pressed && styles.pressed]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** One quiet sentence; its two links share the screen's single link look. */
export function LegalLine() {
  return (
    <View style={styles.line}>
      <Text style={styles.text}>By continuing you accept the </Text>
      <InlineLink label="Terms" url={config.legalUrls.terms} />
      <Text style={styles.text}> and </Text>
      <InlineLink label="Privacy Policy" url={config.legalUrls.privacy} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.micro,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onEmberMuted,
  },
  link: {
    color: colors.onEmber,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 255, 255, 0.5)',
  },
  pressed: { opacity: 0.6 },
});
