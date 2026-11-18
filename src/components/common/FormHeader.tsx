import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = { title: string; children?: React.ReactNode };

export function FormHeader({ title, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

export const formText = StyleSheet.create({
  body: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.onEmberMuted,
  },
  error: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 19,
    color: colors.danger,
    marginTop: spacing.sm,
  },
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  title: {
    ...typography.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: colors.onEmber,
  },
  body: { marginTop: spacing.sm },
});
