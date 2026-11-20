import { ChevronRight, Ellipsis } from 'lucide-react-native';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePressScale } from '@/hooks/usePressScale';
import type { Order } from '@/services/api/orders';
import { colors, font, radius, spacing, typography } from '@/theme';

import {
  arrival,
  STATUS_LABEL,
  dayGroup,
  formatMoney,
  isActive,
  orderAlert,
  orderTitle,
  vendorName,
} from '../format';
import { useOrderActions } from '../useStatusChange';
import { LiveDot } from './OrderCards';
import { OrderAlertNote } from './OrderAlert';
import { ShopLogo } from './ShopLogo';
import { statusLook } from './StatusBadge';

/**
 * An order as a small card in two parts. The top says what it is, who sold
 * it and what it cost; the footer says where it stands. Arriving today turns
 * the footer into Home's solid ember strip, so it can't be missed.
 */
export function OrderLine({
  order,
  onPress,
}: {
  order: Order;
  onPress: (order: Order) => void;
}) {
  const press = usePressScale(0.985);
  const actions = useOrderActions();
  const money = formatMoney(order.amount, order.currency);
  const ended =
    order.isCancelled ||
    order.status === 'RETURNED' ||
    order.status === 'REFUNDED';
  const seller = vendorName(order.vendor);
  const eta = isActive(order) ? arrival(order) : null;
  const alert = orderAlert(order);
  const now = eta?.tone === 'now' && !alert;
  // Only an order arriving today is solid; the rest wear a soft tint of
  // their status colour, so the one urgent card is the one that shouts.
  const look = statusLook(order.status);
  const Icon = look.icon;
  const tone = now ? { bg: look.fill, fg: colors.onEmber } : look;
  // Orders on their way sit under an "Arriving …" header, so only a
  // delivered card needs its own date.
  const note =
    order.isDelivered && order.deliveredAt
      ? dayGroup(order.deliveredAt).label
      : order.status === 'CANCELLED' && order.cancelledAt
      ? dayGroup(order.cancelledAt).label
      : undefined;

  return (
    <Pressable
      onPress={() => onPress(order)}
      onLongPress={() => actions.openMenu(order)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${orderTitle(order)}, ${seller}, ${money ?? ''}, ${
        now ? eta?.text : order.status.toLowerCase().replace(/_/g, ' ')
      }${alert ? `, ${alert.text}` : ''}`}
      accessibilityHint="Opens order details"
    >
      <Animated.View style={[styles.card, press.style]}>
        <View style={styles.top}>
          <ShopLogo vendor={order.vendor} size={48} logoUrl={order.logoUrl} />
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={2}>
              {orderTitle(order)}
            </Text>
            <Text style={styles.seller} numberOfLines={1}>
              {seller}
              {order.titles.length > 1 ? ` · ${order.titles.length} items` : ''}
            </Text>
          </View>
          {money ? (
            <Text style={[styles.amount, ended && styles.struck]}>{money}</Text>
          ) : null}
        </View>

        {alert ? <OrderAlertNote alert={alert} strip /> : null}

        <View
          style={[
            styles.footer,
            { backgroundColor: tone.bg, borderTopColor: tone.bg },
          ]}
        >
          {now ? (
            <LiveDot />
          ) : (
            <Icon size={16} color={tone.fg} strokeWidth={2.6} />
          )}
          <Text style={[styles.footText, { color: tone.fg }]} numberOfLines={1}>
            {now && eta ? eta.text : STATUS_LABEL[order.status]}
          </Text>
          {now && order.carrier ? (
            <Text style={styles.via} numberOfLines={1}>
              via {order.carrier.name}
            </Text>
          ) : (
            <View style={styles.fill} />
          )}
          {note ? (
            <Text style={[styles.note, { color: tone.fg }]} numberOfLines={1}>
              {note}
            </Text>
          ) : null}
          {isActive(order) ? (
            <Pressable
              onPress={() => actions.openMenu(order)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Quick actions"
              style={({ pressed }) => [
                styles.more,
                pressed && styles.morePressed,
              ]}
            >
              <Ellipsis size={20} color={tone.fg} strokeWidth={2.4} />
            </Pressable>
          ) : null}
          <ChevronRight size={18} color={tone.fg} strokeWidth={2.4} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    boxShadow: '0px 6px 16px rgba(60, 20, 5, 0.05)',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
  title: {
    ...font('medium'),
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  seller: { ...typography.label, fontSize: 14, color: colors.textSecondary },
  amount: {
    ...font('bold'),
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    alignSelf: 'flex-start',
  },
  struck: {
    ...font('medium'),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fill: { flex: 1 },
  more: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePressed: { opacity: 0.55 },
  note: {
    ...typography.label,
    fontSize: 13,
    opacity: 0.85,
  },
  footText: {
    ...font('bold'),
    flexShrink: 1,
    fontSize: 15,
  },
  via: {
    ...typography.caption,
    flex: 1,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
