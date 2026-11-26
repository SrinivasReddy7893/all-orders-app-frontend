import { ChartPie, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmberScreen } from '@/components/common/EmberScreen';
import { GlassButton } from '@/components/common/GlassButton';
import { categoryStyle } from '@/features/orders/categories';
import {
  EmptyState,
  SectionTitle,
  sectionStyles,
} from '@/features/orders/components/OrderSections';
import { ShopLogo } from '@/features/orders/components/ShopLogo';
import { SpendBar } from '@/features/orders/components/SpendBar';
import {
  dayGroup,
  formatMoney,
  MONTHS_LONG,
  orderTitle,
  plural,
  spendOrders,
  vendorName,
} from '@/features/orders/format';
import { useOpenOrder } from '@/features/orders/OrderSheetContext';
import { useCountUp } from '@/hooks/useCountUp';
import { describeError } from '@/services/api/errors';
import {
  getSummary,
  type CategorySpend,
  type MonthSummary,
  type Order,
} from '@/services/api/orders';
import { useOrders } from '@/store/orders';
import { useSession } from '@/store/session';
import { colors, display, font, radius, spacing, typography } from '@/theme';

const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/**
 * One month's spend, read top to bottom: pick the month, see the total and its
 * shape, then the categories behind it and the orders behind those. Tapping a
 * category narrows the orders to it.
 */
export function SpendsScreen() {
  const { authorized } = useSession();
  const { orders, summary: current, refreshing, refresh } = useOrders();
  const openOrder = useOpenOrder();
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const month = key(cursor.year, cursor.month);
  const isCurrent = month === key(now.getFullYear(), now.getMonth());
  const [past, setPast] = useState<MonthSummary>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [picked, setPicked] = useState<string>();

  const loadPast = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setPast(await authorized(t => getSummary(t, month)));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [authorized, month]);

  useEffect(() => {
    if (!isCurrent) loadPast();
  }, [isCurrent, loadPast]);

  const summary = isCurrent
    ? current
    : !loading && past?.month === month
    ? past
    : undefined;
  const rows = summary?.categories.filter(c => c.orderCount > 0) ?? [];
  const priced = rows.filter(r => r.spent > 0);
  const total = summary?.totalSpent ?? 0;
  const filter = rows.find(r => r.category === picked);
  const bought = spendOrders(orders, month).filter(
    o => !filter || o.category === filter.category,
  );

  const step = (delta: number) => {
    setPicked(undefined);
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <EmberScreen
      title="Spends"
      refreshing={isCurrent ? refreshing : loading}
      onRefresh={isCurrent ? refresh : loadPast}
      hero={
        <View>
          <View style={styles.months}>
            <GlassButton label="Previous month" onPress={() => step(-1)}>
              <ChevronLeft size={18} color={colors.onEmber} strokeWidth={2.4} />
            </GlassButton>
            <Text style={styles.month} accessibilityLiveRegion="polite">
              {MONTHS_LONG[cursor.month]} {cursor.year}
            </Text>
            <GlassButton
              label="Next month"
              onPress={() => step(1)}
              disabled={isCurrent}
            >
              <ChevronRight
                size={18}
                color={colors.onEmber}
                strokeWidth={2.4}
              />
            </GlassButton>
          </View>
          <Total
            amount={total}
            label={`Spent in ${MONTHS_LONG[cursor.month]}`}
          />
          <Text style={styles.count}>
            {summary ? plural(summary.orderCount, 'order') : ' '}
          </Text>
          {priced.length ? (
            <SpendBar
              animateKey={month}
              total={total}
              segments={priced.map(r => ({
                key: r.category,
                spent: r.spent,
                color: categoryStyle(r.category).bar,
              }))}
            />
          ) : null}
        </View>
      }
    >
      {loading && !isCurrent ? (
        <ActivityIndicator color={colors.emberText} style={styles.loader} />
      ) : error && !isCurrent ? (
        <EmptyState
          icon={ChartPie}
          title="Couldn't load this month"
          body={error}
        />
      ) : rows.length ? (
        <>
          <View style={sectionStyles.section}>
            <SectionTitle title="Categories" />
            <View style={styles.group}>
              {rows.map((r, i) => (
                <CategoryRow
                  key={r.category}
                  row={r}
                  share={total > 0 ? r.spent / total : 0}
                  selected={r.category === picked}
                  last={i === rows.length - 1}
                  onPress={() =>
                    setPicked(p => (p === r.category ? undefined : r.category))
                  }
                />
              ))}
            </View>
          </View>

          {bought.length ? (
            <View style={sectionStyles.section}>
              <View style={styles.ordersHead}>
                <SectionTitle title={filter ? filter.label : 'Orders'} />
                {filter ? (
                  <Pressable
                    onPress={() => setPicked(undefined)}
                    hitSlop={12}
                    accessibilityRole="button"
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Text style={styles.showAll}>Show all</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.group}>
                {bought.map((o, i) => (
                  <BoughtRow
                    key={o.id}
                    order={o}
                    last={i === bought.length - 1}
                    onPress={() => openOrder(o)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.note}>
            Cancelled and returned orders aren’t counted.
            {summary?.unpricedOrders
              ? ` ${plural(summary.unpricedOrders, 'order')} had no price.`
              : ''}
          </Text>
        </>
      ) : (
        <EmptyState
          icon={ChartPie}
          title={isCurrent ? 'Nothing spent yet this month' : 'No spends'}
          body={
            isCurrent
              ? 'Spends add up here as order emails arrive.'
              : `No orders were found for ${MONTHS_LONG[cursor.month]}.`
          }
        />
      )}
    </EmberScreen>
  );
}

/** The month's total, counting up, with any paise set smaller. */
function Total({ amount, label }: { amount: number; label: string }) {
  const money = formatMoney(useCountUp(amount)) ?? '₹0';
  const dot = money.indexOf('.');
  return (
    <Text
      style={styles.total}
      accessibilityRole="header"
      accessibilityLabel={`${label}: ${formatMoney(amount) ?? '₹0'}`}
      adjustsFontSizeToFit
      numberOfLines={1}
    >
      {dot > 0 ? money.slice(0, dot) : money}
      {dot > 0 ? <Text style={styles.paise}>{money.slice(dot)}</Text> : null}
    </Text>
  );
}

/** The icon tile wears the category's bar colour, so it doubles as the key. */
function CategoryRow({
  row,
  share,
  selected,
  last,
  onPress,
}: {
  row: CategorySpend;
  share: number;
  selected: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const { icon: Icon, bar } = categoryStyle(row.category);
  const money = formatMoney(row.spent) ?? '₹0';
  // Under one percent reads as "<1%", never "0%".
  const percent =
    row.spent > 0 && share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${row.label}, ${money}, ${percent}, ${plural(
        row.orderCount,
        'order',
      )}`}
      accessibilityHint="Shows only these orders"
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.mark, { backgroundColor: bar }]}>
        <Icon size={18} color={colors.ink} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text
          style={[styles.name, selected && styles.nameOn]}
          numberOfLines={1}
        >
          {row.label}
        </Text>
        <Text style={[styles.meta, selected && styles.nameOn]}>
          {selected ? 'Showing below' : plural(row.orderCount, 'order')}
        </Text>
      </View>
      <View style={styles.end}>
        <Text style={styles.amount}>{money}</Text>
        <Text style={styles.meta}>{percent}</Text>
      </View>
    </Pressable>
  );
}

function BoughtRow({
  order,
  last,
  onPress,
}: {
  order: Order;
  last: boolean;
  onPress: () => void;
}) {
  const money = formatMoney(order.amount, order.currency);
  const when = order.orderedAt ? dayGroup(order.orderedAt).label : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${orderTitle(order)}, ${vendorName(
        order.vendor,
      )}, ${when}, ${money ?? 'no price'}`}
      accessibilityHint="Opens order details"
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <ShopLogo vendor={order.vendor} size={40} logoUrl={order.logoUrl} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {orderTitle(order)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {vendorName(order.vendor)} · {when}
        </Text>
      </View>
      <Text style={money ? styles.amount : styles.meta}>
        {money ?? 'No price'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  months: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: { ...typography.label, color: colors.onEmber },
  total: {
    ...display,
    fontSize: 44,
    lineHeight: 56,
    letterSpacing: -1,
    textAlign: 'center',
    color: colors.onEmber,
    marginTop: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  paise: {
    ...font('medium'),
    fontSize: 24,
    color: colors.onEmberSubtle,
  },
  count: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.onEmberSubtle,
  },
  loader: { marginTop: spacing.xl },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  pressed: { opacity: 0.6 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 1 },
  end: { alignItems: 'flex-end', gap: 1 },
  name: { ...typography.label, color: colors.textPrimary },
  nameOn: { color: colors.emberText },
  meta: { ...typography.caption, color: colors.textSecondary },
  amount: {
    ...typography.label,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  ordersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xxs,
  },
  showAll: { ...typography.label, color: colors.emberText },
  note: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
