import { useIsFocused } from '@react-navigation/native';
import { CalendarDays, SearchX, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarSheet } from '@/features/orders/components/CalendarSheet';
import { OrderLine } from '@/features/orders/components/OrderLine';
import { StatusTabs } from '@/features/orders/components/StatusTabs';
import { EmptyState } from '@/features/orders/components/OrderSections';
import {
  arrivalGroup,
  bySoonest,
  dateFilterLabel,
  isActive,
  matchesDate,
  matchesQuery,
  dayGroup,
  type DateFilter,
} from '@/features/orders/format';
import { useOpenOrder } from '@/features/orders/OrderSheetContext';
import { SearchBar } from '@/features/search/SearchBar';
import { useSwapIn } from '@/hooks/useSwapIn';
import type { Order } from '@/services/api/orders';
import { useOrders } from '@/store/orders';
import { colors, display, radius, spacing, typography } from '@/theme';

type Filter = { key: string; label: string; test: (o: Order) => boolean };

const FILTERS: Filter[] = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'ACTIVE', label: 'On the way', test: isActive },
  { key: 'DELIVERED', label: 'Delivered', test: o => o.isDelivered },
  {
    key: 'CLOSED',
    label: 'Cancelled',
    test: o =>
      o.isCancelled || o.status === 'RETURNED' || o.status === 'REFUNDED',
  },
];

/**
 * Every order, newest month first, on a plain white page: a title, one
 * search field, one row of filters, then the list. Nothing else competes.
 */
export function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { orders, refreshing, refresh } = useOrders();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [date, setDate] = useState<DateFilter | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [raised, setRaised] = useState(false);
  const openOrder = useOpenOrder();

  const inDate = orders.filter(o => matchesDate(o, date));
  const test = FILTERS.find(f => f.key === status)?.test ?? (() => true);
  const visible = inDate.filter(o => test(o) && matchesQuery(o, query));

  // Orders still on their way come first, soonest arrival first (today,
  // tomorrow, then by date). Everything settled follows, newest order first.
  const groups = useMemo(() => {
    const incoming =
      status === 'ALL' || status === 'ACTIVE'
        ? visible.filter(isActive).sort(bySoonest)
        : [];
    const rest = visible.filter(o => !incoming.includes(o));

    type Group = { key: string; label: string; list: Order[]; soon?: boolean };
    const build = (
      list: Order[],
      pick: (o: Order) => { key: string; label: string },
      soon: boolean,
    ) => {
      const map = new Map<string, Group>();
      for (const o of list) {
        const { key, label } = pick(o);
        const group = map.get(`${soon}-${key}`) ?? {
          key: `${soon}-${key}`,
          label,
          list: [],
          soon,
        };
        group.list.push(o);
        map.set(group.key, group);
      }
      return [...map.values()];
    };

    return [
      ...build(incoming, o => arrivalGroup(o), true).sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
      ...build(rest, o => dayGroup(o.orderedAt), false),
    ];
  }, [visible, status]);

  const swap = useSwapIn(`${status}|${date ? dateFilterLabel(date) : ''}`);

  return (
    <View style={styles.screen}>
      {focused ? <StatusBar barStyle="dark-content" /> : null}

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.sm },
          raised && styles.headerRaised,
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Orders
          </Text>
          <Pressable
            onPress={() => setCalendar(true)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Filter by date"
            style={({ pressed }) => [
              styles.iconButton,
              !!date && styles.iconButtonOn,
              pressed && styles.pressed,
            ]}
          >
            <CalendarDays
              size={20}
              color={date ? colors.emberText : colors.textPrimary}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <SearchBar value={query} onChange={setQuery} variant="filled" />

        <View style={styles.tabs}>
          <StatusTabs
            value={status}
            onChange={setStatus}
            options={FILTERS.map(f => ({
              key: f.key,
              label: f.label,
              count: inDate.filter(f.test).length,
            }))}
          />
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        scrollEventThrottle={32}
        onScroll={e => {
          const next = e.nativeEvent.contentOffset.y > 2;
          setRaised(prev => (prev === next ? prev : next));
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.ember]}
          />
        }
      >
        <Animated.View style={swap}>
          {date ? (
            <Pressable
              onPress={() => setDate(null)}
              accessibilityRole="button"
              accessibilityLabel={`Remove date filter ${dateFilterLabel(date)}`}
              style={styles.dateChip}
            >
              <CalendarDays
                size={14}
                color={colors.emberText}
                strokeWidth={2.2}
              />
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

          {groups.map(({ key, label, list, soon }) => (
            <View key={key} style={styles.group}>
              <Text
                style={[
                  styles.day,
                  soon && label === 'Arriving today' && styles.dayNow,
                ]}
              >
                {label}
              </Text>
              {list.map(o => (
                <OrderLine key={o.id} order={o} onPress={openOrder} />
              ))}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <CalendarSheet
        visible={calendar}
        orders={orders}
        value={date}
        onChange={setDate}
        onClose={() => setCalendar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  headerRaised: { boxShadow: '0px 6px 16px rgba(60, 20, 5, 0.07)', zIndex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  title: {
    ...display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonOn: {
    backgroundColor: colors.emberTint,
    borderColor: colors.emberTint,
  },
  tabs: { marginHorizontal: -spacing.md },
  pressed: { opacity: 0.6 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  group: { gap: spacing.xs + 2 },
  dayNow: { color: colors.emberText },
  day: {
    ...display,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 32,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.emberTint,
  },
  dateText: { ...typography.label, fontSize: 13, color: colors.emberText },
});
