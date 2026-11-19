import {
  CalendarDays,
  CircleX,
  PackageCheck,
  ReceiptText,
  SearchX,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmberScreen } from '@/components/common/EmberScreen';
import { GlassButton } from '@/components/common/GlassButton';
import { CalendarSheet } from '@/features/orders/components/CalendarSheet';
import {
  EmptyState,
  OrderList,
  SectionTitle,
  sectionStyles,
} from '@/features/orders/components/OrderSections';
import { GlassTile } from '@/features/orders/components/SpendBreakdown';
import {
  dateFilterLabel,
  isActive,
  matchesDate,
  matchesQuery,
  monthKey,
  orderTitle,
  type DateFilter,
} from '@/features/orders/format';
import { SearchBar } from '@/features/search/SearchBar';
import type { Order } from '@/services/api/orders';
import { useOrders } from '@/store/orders';
import { colors, radius, spacing, typography } from '@/theme';

type Status = {
  key: string;
  label: string;
  icon: LucideIcon;
  test: (o: Order) => boolean;
};

const STATUS: Status[] = [
  { key: 'ALL', label: 'All orders', icon: ReceiptText, test: () => true },
  { key: 'ACTIVE', label: 'On the way', icon: Truck, test: isActive },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: PackageCheck,
    test: o => o.isDelivered,
  },
  {
    key: 'CLOSED',
    label: 'Cancelled',
    icon: CircleX,
    test: o =>
      o.isCancelled || o.status === 'RETURNED' || o.status === 'REFUNDED',
  },
];

/**
 * Every order, newest month first. The ember header counts orders by
 * status (tap a tile to filter); search and the calendar narrow further.
 */
export function OrdersScreen() {
  const { orders, refreshing, refresh } = useOrders();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [date, setDate] = useState<DateFilter | null>(null);
  const [calendar, setCalendar] = useState(false);

  const inDate = orders.filter(o => matchesDate(o, date));
  const test = STATUS.find(s => s.key === status)?.test ?? (() => true);
  const visible = inDate.filter(o => test(o) && matchesQuery(o, query));

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of visible) {
      const key = monthKey(o.orderedAt);
      map.set(key, [...(map.get(key) ?? []), o]);
    }
    return [...map.entries()];
  }, [visible]);

  const examples = useMemo(
    () => orders.map(o => o.orderId ?? orderTitle(o)).slice(0, 5),
    [orders],
  );

  return (
    <EmberScreen
      title="Orders"
      refreshing={refreshing}
      onRefresh={refresh}
      accessory={
        <GlassButton
          label="Filter by date"
          onPress={() => setCalendar(true)}
          active={!!date}
        >
          <CalendarDays
            size={18}
            color={date ? colors.emberText : colors.onEmber}
            strokeWidth={2.2}
          />
        </GlassButton>
      }
      renderSearch={variant => (
        <SearchBar
          value={query}
          onChange={setQuery}
          examples={examples}
          variant={variant}
        />
      )}
      hero={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tilesScroll}
          contentContainerStyle={styles.tiles}
        >
          {STATUS.map(s => {
            const Icon = s.icon;
            const on = s.key === status;
            return (
              <GlassTile
                key={s.key}
                selected={on}
                icon={
                  <View style={[styles.icon, on && styles.iconOn]}>
                    <Icon
                      size={14}
                      color={on ? colors.onEmber : colors.ink}
                      strokeWidth={2.2}
                    />
                  </View>
                }
                value={String(inDate.filter(s.test).length)}
                label={s.label}
                onPress={() => setStatus(s.key)}
              />
            );
          })}
        </ScrollView>
      }
    >
      {date ? (
        <Pressable
          onPress={() => setDate(null)}
          accessibilityRole="button"
          accessibilityLabel={`Remove date filter ${dateFilterLabel(date)}`}
          style={styles.dateChip}
        >
          <CalendarDays size={14} color={colors.emberText} strokeWidth={2.2} />
          <Text style={styles.dateText}>{dateFilterLabel(date)}</Text>
          <X size={14} color={colors.emberText} strokeWidth={2.4} />
        </Pressable>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching orders"
          body={
            date
              ? `No orders on ${dateFilterLabel(date)}. Try another date.`
              : 'Try a product, shop or order ID, or another filter.'
          }
        />
      ) : null}

      {groups.map(([month, list]) => (
        <View key={month} style={sectionStyles.section}>
          <SectionTitle title={month} count={list.length} />
          <OrderList orders={list} />
        </View>
      ))}

      <CalendarSheet
        visible={calendar}
        orders={orders}
        value={date}
        onChange={setDate}
        onClose={() => setCalendar(false)}
      />
    </EmberScreen>
  );
}

const styles = StyleSheet.create({
  tilesScroll: { marginHorizontal: -spacing.lg },
  tiles: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD2A8',
  },
  iconOn: { backgroundColor: colors.emberText },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.emberTint,
  },
  dateText: { ...typography.label, fontSize: 13, color: colors.emberText },
});
