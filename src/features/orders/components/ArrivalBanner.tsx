import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Order } from '@/services/api/orders';
import { colors, font, radius, spacing, typography } from '@/theme';

import { arrival } from '../format';
import { LiveDot } from './OrderCards';

/**
 * When it lands, said loudly. Today is solid ember with a breathing dot (the
 * same signal as Home's card strip); tomorrow a warm tint; later, quiet.
 */
export function ArrivalBanner({ order }: { order: Order }) {
  const eta = arrival(order);
  const now = eta.tone === 'now';
  return (
    <View
      style={[styles.banner, styles[eta.tone]]}
      accessible
      accessibilityLabel={`${eta.text}${
        order.carrier ? ` via ${order.carrier.name}` : ''
      }`}
    >
      {now ? <LiveDot /> : null}
      <Text style={[styles.text, now && styles.onStrong]} numberOfLines={1}>
        {eta.text}
      </Text>
      {order.carrier ? (
        <Text style={[styles.via, now && styles.viaStrong]} numberOfLines={1}>
          via {order.carrier.name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  now: { backgroundColor: colors.emberText },
  soon: { backgroundColor: colors.emberTint },
  later: { backgroundColor: colors.canvas },
  text: {
    ...font('bold'),
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  onStrong: { color: colors.onEmber },
  via: { ...typography.body, flex: 1, color: colors.textSecondary },
  viaStrong: { color: 'rgba(255, 255, 255, 0.85)' },
});
