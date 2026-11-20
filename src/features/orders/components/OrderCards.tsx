import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppActive } from '@/hooks/useAppActive';
import { usePressScale } from '@/hooks/usePressScale';
import type { Order } from '@/services/api/orders';
import { colors, gradients, radius, spacing, typography } from '@/theme';

import {
  arrival,
  formatDay,
  formatMoney,
  orderTitle,
  vendorName,
} from '../format';
import { useOpenOrder } from '../OrderSheetContext';
import { ShopLogo } from './ShopLogo';
import { OrderId } from './OrderId';
import { StatusBadge } from './StatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { useOrderActions } from '../useStatusChange';

/**
 * An order still on its way, read top to bottom like a delivery app:
 * when it lands (tinted strip), what it is, how far along, and the
 * order number to quote. One tap anywhere opens courier tracking.
 */
export function ActiveOrderCard({ order }: { order: Order }) {
  const press = usePressScale(0.98);
  const openOrder = useOpenOrder();
  const actions = useOrderActions();
  const eta = arrival(order);
  const more = order.titles.length > 1 ? order.titles.length - 1 : 0;
  const money = formatMoney(order.amount, order.currency);
  return (
    <Pressable
      onPress={() => openOrder(order)}
      onLongPress={() => actions.openMenu(order)}
      unstable_pressDelay={90}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityHint="Opens the order details"
    >
      <Animated.View style={[styles.card, press.style]}>
        <View style={[styles.strip, stripTone[eta.tone]]}>
          {eta.tone === 'now' ? <LiveDot /> : null}
          <Text
            style={[styles.stripText, eta.tone === 'now' && styles.onStrong]}
            numberOfLines={1}
          >
            {eta.text}
            {order.carrier ? (
              <Text
                style={[styles.via, eta.tone === 'now' && styles.viaStrong]}
              >
                {`  via ${order.carrier.name}`}
              </Text>
            ) : null}
          </Text>
          <View style={styles.trackLink}>
            <Text
              style={[styles.trackText, eta.tone === 'now' && styles.onStrong]}
            >
              Details
            </Text>
            <ChevronRight
              size={16}
              color={eta.tone === 'now' ? colors.onEmber : colors.emberText}
              strokeWidth={2.4}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.head}>
            <ShopLogo vendor={order.vendor} logoUrl={order.logoUrl} />
            <View style={styles.headText}>
              <Text style={styles.title} numberOfLines={2}>
                {orderTitle(order)}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[
                  vendorName(order.vendor),
                  more ? `+${more} more` : null,
                  money,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>

          <OrderTimeline
            status={order.status}
            onSelect={step => actions.moveTo(order, step)}
          />

          {order.orderId ? (
            <View style={styles.foot}>
              <Text style={styles.footLabel}>Order ID</Text>
              <OrderId id={order.orderId} />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** A soft breathing dot for "arriving today" (still under reduced motion). */
export function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  const active = useAppActive();
  useEffect(() => {
    if (!active) return;
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.35,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse, active]);
  return <Animated.View style={[styles.liveDot, { opacity: pulse }]} />;
}

/** A settled order: one quiet row. */
export function OrderRow({ order, last }: { order: Order; last?: boolean }) {
  const openOrder = useOpenOrder();
  const money = formatMoney(order.amount, order.currency);
  const when = order.deliveredAt ?? order.orderedAt;
  const muted =
    order.isCancelled ||
    order.status === 'RETURNED' ||
    order.status === 'REFUNDED';
  return (
    <Pressable
      onPress={() => openOrder(order)}
      accessibilityRole="button"
      accessibilityHint="Opens the order details"
      style={({ pressed }) => [
        styles.rowWrap,
        !last && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.row}>
        <ShopLogo vendor={order.vendor} size={40} logoUrl={order.logoUrl} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {orderTitle(order)}
          </Text>
          <Text style={styles.meta} numberOfLines={2}>
            {vendorName(order.vendor)}
            {when ? ` · ${formatDay(when)}` : ''}
          </Text>
        </View>
        {money ? (
          <Text style={[styles.amount, muted && styles.struck]}>{money}</Text>
        ) : null}
      </View>
      <View style={styles.rowMeta}>
        <StatusBadge status={order.status} />
        {order.orderId ? <OrderId id={order.orderId} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    backgroundImage: gradients.orderCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    boxShadow: '0px 8px 20px rgba(226, 80, 26, 0.08)',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  stripText: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
  },
  onStrong: { color: colors.onEmber },
  via: { ...typography.caption, color: colors.textSecondary },
  viaStrong: { color: 'rgba(255, 255, 255, 0.8)' },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onEmber,
  },
  footLabel: { ...typography.caption, color: colors.textSecondary },
  trackLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trackText: { ...typography.label, fontSize: 14, color: colors.emberText },
  body: { padding: spacing.md, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, gap: 4 },
  title: {
    ...typography.title,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  meta: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  rowWrap: { paddingVertical: spacing.sm, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // Status then ID, under the text column; wraps rather than truncating.
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: 40 + spacing.sm,
  },
  rowPressed: { opacity: 0.6 },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...typography.label, color: colors.textPrimary },
  amount: {
    ...typography.label,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  struck: { color: colors.textSecondary, textDecorationLine: 'line-through' },
});

// Today: solid ember (white text ≥4.5:1). Tomorrow: warm tint. Later: quiet.
const stripTone = StyleSheet.create({
  now: { backgroundColor: colors.emberText },
  soon: { backgroundColor: colors.emberTint },
  later: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
});
