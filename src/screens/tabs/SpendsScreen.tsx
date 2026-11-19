import { ChartPie, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EmberScreen } from '@/components/common/EmberScreen';
import { GlassButton } from '@/components/common/GlassButton';
import { categoryStyle } from '@/features/orders/categories';
import {
  EmptyState,
  SectionTitle,
  sectionStyles,
} from '@/features/orders/components/OrderSections';
import { SpendTotal } from '@/features/orders/components/SpendBreakdown';
import { formatMoney, MONTHS_LONG, plural } from '@/features/orders/format';
import { describeError } from '@/services/api/errors';
import { getSummary, type MonthSummary } from '@/services/api/orders';
import { useOrders } from '@/store/orders';
import { useSession } from '@/store/session';
import { colors, gradients, radius, spacing, typography } from '@/theme';

const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/** A month's spend: the total and its shape in ember, categories below. */
export function SpendsScreen() {
  const { authorized } = useSession();
  const { summary: current, refreshing, refresh } = useOrders();
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const isCurrent =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth();
  const [past, setPast] = useState<MonthSummary>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadPast = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setPast(
        await authorized(t => getSummary(t, key(cursor.year, cursor.month))),
      );
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [authorized, cursor]);

  useEffect(() => {
    if (!isCurrent) loadPast();
  }, [isCurrent, loadPast]);

  const summary = isCurrent ? current : loading ? undefined : past;
  const rows = summary?.categories.filter(c => c.orderCount > 0) ?? [];
  const priced = rows.filter(r => r.spent > 0);
  const total = summary?.totalSpent ?? 0;

  const step = (delta: number) =>
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <EmberScreen
      title="Spends"
      refreshing={isCurrent ? refreshing : loading}
      onRefresh={isCurrent ? refresh : loadPast}
      accessory={
        <>
          <GlassButton label="Previous month" onPress={() => step(-1)}>
            <ChevronLeft size={18} color={colors.onEmber} strokeWidth={2.4} />
          </GlassButton>
          <GlassButton
            label="Next month"
            onPress={() => step(1)}
            disabled={isCurrent}
          >
            <ChevronRight size={18} color={colors.onEmber} strokeWidth={2.4} />
          </GlassButton>
        </>
      }
      hero={
        <View>
          <SpendTotal
            label={`Spent in ${MONTHS_LONG[cursor.month]} ${cursor.year}`}
            amount={total}
            pill={
              summary?.orderCount
                ? plural(summary.orderCount, 'order')
                : undefined
            }
          />
          {priced.length ? (
            <View style={styles.bar}>
              {priced.map(r => (
                <View
                  key={r.category}
                  style={[
                    styles.segment,
                    {
                      flex: Math.max(r.spent, total * 0.02),
                      backgroundColor: categoryStyle(r.category).bar,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
          <Text style={styles.note}>
            {summary?.unpricedOrders
              ? `${plural(summary.unpricedOrders, 'order')} without a price · `
              : ''}
            Cancellations not counted
          </Text>
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
        <View style={sectionStyles.section}>
          <SectionTitle title="By category" count={rows.length} />
          <View style={styles.list}>
            {rows.map((r, i) => {
              const share = total > 0 ? r.spent / total : 0;
              const { icon: Icon, tint, ink } = categoryStyle(r.category);
              return (
                <View
                  key={r.category}
                  style={[styles.row, i < rows.length - 1 && styles.divider]}
                  accessible
                  accessibilityLabel={`${r.label}, ${formatMoney(
                    r.spent,
                  )}, ${Math.round(share * 100)} percent, ${plural(
                    r.orderCount,
                    'order',
                  )}`}
                >
                  <View style={[styles.mark, { backgroundColor: tint }]}>
                    <Icon size={18} color={ink} strokeWidth={2} />
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {r.label}
                      </Text>
                      <Text style={styles.rowValue}>
                        {formatMoney(r.spent)}
                      </Text>
                    </View>
                    <View style={styles.shareTrack}>
                      <View
                        style={[
                          styles.shareFill,
                          {
                            width: `${Math.max(share * 100, 2)}%`,
                            backgroundColor: ink,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.rowMeta}>
                      {plural(r.orderCount, 'order')} ·{' '}
                      {Math.round(share * 100)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
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

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 3, height: 10, marginTop: spacing.md },
  segment: { borderRadius: 5 },
  note: {
    ...typography.caption,
    color: colors.onEmberSubtle,
    marginTop: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  list: {
    backgroundColor: colors.surface,
    backgroundImage: gradients.orderCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 8px 20px rgba(226, 80, 26, 0.06)',
  },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 6 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: { ...typography.label, color: colors.textPrimary, flexShrink: 1 },
  rowValue: {
    ...typography.label,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  shareTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  shareFill: { height: '100%', borderRadius: 3 },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
});
