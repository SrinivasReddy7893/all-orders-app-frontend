import React from 'react';
import { Pressable, StyleSheet, Text, type TextStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  style?: TextStyle;
  accessibilityHint?: string;
  /** start: aligns the label (not its touch padding) with text above. */
  align?: 'center' | 'start';
};

/** Standalone text action with a 48dp touch target. */
export function TextLink({
  label,
  onPress,
  style,
  accessibilityHint,
  align = 'center',
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.target,
        align === 'start' && styles.start,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, style]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    alignSelf: 'center',
  },
  start: { alignSelf: 'flex-start', marginLeft: -spacing.sm },
  pressed: { opacity: 0.6 },
  text: { ...typography.label, color: colors.onEmber },
});
