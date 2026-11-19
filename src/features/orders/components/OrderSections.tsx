import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { Order } from '@/services/api/orders';
import {
  colors,
  display,
  font,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';

import { OrderRow } from './OrderCards';

export function SectionTitle({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {count ? (
        <View style={styles.countBubble}>
          <Text style={styles.sectionCount}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Settled orders as one white group of quiet rows. */
export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <View style={styles.list}>
      {orders.map((o, i) => (
        <OrderRow key={o.id} order={o} last={i === orders.length - 1} />
      ))}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  busy,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  busy?: boolean;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        {busy ? (
          <ActivityIndicator color={colors.emberText} />
        ) : (
          <Icon size={26} color={colors.emberText} strokeWidth={1.8} />
        )}
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {children}
    </View>
  );
}

export const sectionStyles = StyleSheet.create({
  section: { gap: spacing.sm },
  cards: { gap: spacing.sm },
  pill: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
});

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  // Section labels: bold capitals, tracked out so caps don't crowd.
  sectionTitle: {
    ...display,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
  // A filled ember bubble beside the heading: the number reads first.
  countBubble: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: colors.emberText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCount: {
    ...font('bold'),
    fontSize: 13,
    lineHeight: 16,
    color: colors.onEmber,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  list: {
    backgroundColor: colors.surface,
    backgroundImage: gradients.orderCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 8px 20px rgba(226, 80, 26, 0.06)',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.emberTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...display,
    fontSize: 19,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 300,
  },
});
