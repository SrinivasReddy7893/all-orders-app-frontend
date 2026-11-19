import {
  Check,
  CircleX,
  Clock,
  Package,
  Truck,
  Undo2,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { OrderStatus } from '@/services/api/orders';
import { colors, radius, typography } from '@/theme';

import { STATUS_LABEL } from '../format';

type Look = { icon: LucideIcon; bg: string; fg: string; fill: string };

// One colour per meaning, so a list scans by colour before it is read:
// green done, solid ember = at your door today, blue moving, slate waiting,
// red ended. All text ≥4.5:1 on its tint.
const NEUTRAL: Look = {
  icon: Clock,
  bg: colors.stoneTint,
  fg: colors.stone,
  fill: colors.stone,
};
const LOOK: Record<OrderStatus, Look> = {
  PLACED: NEUTRAL,
  CONFIRMED: NEUTRAL,
  PROCESSING: { ...NEUTRAL, icon: Package },
  SHIPPED: {
    icon: Truck,
    bg: colors.amberTint,
    fg: colors.amberText,
    fill: colors.amberFill,
  },
  OUT_FOR_DELIVERY: {
    icon: Truck,
    bg: colors.emberText,
    fg: colors.onEmber,
    fill: colors.emberText,
  },
  DELIVERED: {
    icon: Check,
    bg: colors.successTint,
    fg: colors.success,
    fill: colors.success,
  },
  CANCELLED: {
    icon: CircleX,
    bg: colors.dangerTint,
    fg: colors.dangerText,
    fill: colors.dangerFill,
  },
  RETURNED: {
    icon: Undo2,
    bg: colors.dangerTint,
    fg: colors.dangerText,
    fill: colors.dangerFill,
  },
  REFUNDED: {
    icon: Undo2,
    bg: colors.dangerTint,
    fg: colors.dangerText,
    fill: colors.dangerFill,
  },
};

/** A status's icon and solid fill (white text sits on it at 4.5:1+). */
export const statusLook = (status: OrderStatus) => LOOK[status];

/** Where an order stands, as a coloured pill with a small icon. */
export function StatusBadge({
  status,
  size = 'md',
}: {
  status: OrderStatus;
  size?: 'md' | 'lg';
}) {
  const { icon: Icon, bg, fg } = LOOK[status];
  const lg = size === 'lg';
  return (
    <View
      style={[styles.pill, lg && styles.pillLg, { backgroundColor: bg }]}
      accessible
      accessibilityLabel={`Status: ${STATUS_LABEL[status]}`}
    >
      <Icon size={lg ? 15 : 12} color={fg} strokeWidth={2.6} />
      <Text
        style={[styles.text, lg && styles.textLg, { color: fg }]}
        numberOfLines={1}
      >
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  pillLg: { height: 32, paddingHorizontal: 13, gap: 6 },
  textLg: { fontSize: 14, lineHeight: 18 },
  text: { ...typography.label, fontSize: 12, lineHeight: 16 },
});
