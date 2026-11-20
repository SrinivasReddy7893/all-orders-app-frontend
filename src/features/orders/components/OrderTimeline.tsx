import {
  Check,
  House,
  PackageCheck,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OrderStatus } from '@/services/api/orders';
import { colors, spacing, typography } from '@/theme';

import { trackStep } from '../format';

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: 'Placed', icon: ShoppingBag },
  { label: 'Packed', icon: PackageCheck },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: House },
];

const NODE = 30;

/**
 * Four stops, each in an equal column so the label sits under its node.
 * Done: ink with a check. Now: ember with its own icon and a soft ring.
 * Ahead: hollow, joined by a dashed line, so "what's left" reads at once.
 */
export function OrderTimeline({
  status,
  onSelect,
}: {
  status: OrderStatus;
  /** Makes the stops still ahead tappable, to say the order has got there. */
  onSelect?: (step: number) => void;
}) {
  const step = trackStep(status);
  const nowLabel =
    status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : STEPS[step].label;
  // Short on screen so it survives large system text; the full phrase is read aloud.
  const nowShown = status === 'OUT_FOR_DELIVERY' ? 'On the way' : nowLabel;
  const last = STEPS.length - 1;

  return (
    <View
      style={styles.row}
      // A read-only timeline is one spoken line; a tappable one keeps its stops reachable.
      accessible={!onSelect}
      accessibilityLabel={`Step ${step + 1} of 4: ${nowLabel}`}
    >
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < step;
        const now = i === step;
        const tappable = !!onSelect && i > step;
        return (
          <Pressable
            key={label}
            style={styles.stop}
            disabled={!tappable}
            onPress={() => onSelect?.(i)}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole={tappable ? 'button' : undefined}
            accessibilityLabel={
              tappable
                ? `Mark as ${label.toLowerCase()}`
                : now
                ? `Now: ${nowLabel}`
                : `${label}, done`
            }
            accessibilityState={onSelect ? { disabled: !tappable } : undefined}
          >
            <View style={styles.rail}>
              {i > 0 ? (
                <View
                  style={[
                    styles.half,
                    styles.left,
                    i <= step ? styles.solid : styles.dashed,
                  ]}
                />
              ) : null}
              {i < last ? (
                <View
                  style={[
                    styles.half,
                    styles.right,
                    i < step ? styles.solid : styles.dashed,
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.node,
                  done && styles.nodeDone,
                  now && styles.nodeNow,
                  tappable && styles.nodeTap,
                ]}
              >
                {done ? (
                  <Check size={15} color={colors.onInk} strokeWidth={3} />
                ) : (
                  <Icon
                    size={15}
                    color={now ? colors.onEmber : colors.textSecondary}
                    strokeWidth={2.2}
                  />
                )}
              </View>
            </View>
            <Text
              style={[styles.label, now && styles.labelNow]}
              numberOfLines={1}
            >
              {now ? nowShown : label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginHorizontal: -spacing.xs },
  stop: { flex: 1, alignItems: 'center', gap: 6 },
  rail: {
    alignSelf: 'stretch',
    height: NODE + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  half: { position: 'absolute', top: (NODE + 8) / 2 - 1, width: '50%' },
  left: { left: 0 },
  right: { right: 0 },
  solid: { height: 2, backgroundColor: colors.ink },
  dashed: {
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  nodeTap: { borderColor: colors.border },
  nodeDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  // The ring is a wide translucent border, so it needs no extra view.
  nodeNow: {
    width: NODE + 8,
    height: NODE + 8,
    borderRadius: (NODE + 8) / 2,
    backgroundColor: colors.ember,
    borderWidth: 4,
    borderColor: 'rgba(226, 80, 26, 0.18)',
  },
  label: {
    ...typography.micro,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelNow: { ...typography.label, fontSize: 12, color: colors.textPrimary },
});
