import { Clock3, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing, typography } from '@/theme';

import type { OrderAlert as Alert } from '../format';

const LOOK = {
  overdue: {
    icon: TriangleAlert,
    bg: colors.dangerTint,
    fg: colors.dangerText,
  },
  stalled: { icon: Clock3, bg: colors.amberTint, fg: colors.amberText },
} as const;

/**
 * A quiet warning for an order that is late or has gone silent. `strip` sits
 * flush inside a card; the default is a rounded banner for the order sheet,
 * with a line on what to do next.
 */
export function OrderAlertNote({
  alert,
  strip,
  hint,
}: {
  alert: Alert;
  strip?: boolean;
  hint?: string;
}) {
  const look = LOOK[alert.kind];
  const Icon = look.icon;
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={hint ? `${alert.text}. ${hint}` : alert.text}
      style={[
        strip ? styles.strip : styles.banner,
        { backgroundColor: look.bg },
      ]}
    >
      <Icon size={strip ? 15 : 18} color={look.fg} strokeWidth={2.4} />
      <View style={styles.copy}>
        <Text style={[styles.text, { color: look.fg }]}>{alert.text}</Text>
        {hint && !strip ? (
          <Text style={[styles.hint, { color: look.fg }]}>{hint}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  copy: { flex: 1, gap: 2 },
  text: { ...font('bold'), fontSize: 14, lineHeight: 19 },
  hint: { ...typography.caption, opacity: 0.92 },
});
