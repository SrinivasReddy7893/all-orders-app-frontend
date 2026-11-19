import { ArrowUpRight } from 'lucide-react-native';
import React from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCountUp } from '@/hooks/useCountUp';
import { usePressScale } from '@/hooks/usePressScale';
import type { MonthSummary } from '@/services/api/orders';
import { colors, display, font, radius, spacing, typography } from '@/theme';

import { categoryStyle } from '../categories';
import { formatMoney, monthName, plural } from '../format';
import { SpendBar } from './SpendBar';

type Props = { summary: MonthSummary; onSeeAll?: () => void };

/**
 * The month's spend, fintech-style: one big number (paise muted), one
 * segmented bar for the shape, then a swipeable row of category tiles.
 * Every category is reachable here; the last tile opens Spends.
 */
export function SpendBreakdown({ summary, onSeeAll }: Props) {
  const total = summary.totalSpent;
  const rows = summary.categories.filter(c => c.spent > 0);

  return (
    <View>
      <SpendTotal
        label={`Spent in ${monthName(summary.month)}`}
        amount={total}
        pill={
          summary.orderCount ? plural(summary.orderCount, 'order') : undefined
        }
      />

      {rows.length ? (
        <>
          <SpendBar
            animateKey={summary.month}
            total={total}
            segments={rows.map(r => ({
              key: r.category,
              spent: r.spent,
              color: categoryStyle(r.category).bar,
            }))}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tilesScroll}
            contentContainerStyle={styles.tiles}
          >
            {rows.map(r => (
              <CategoryTile
                key={r.category}
                category={r.category}
                label={r.label}
                spent={r.spent}
                share={Math.round((r.spent / total) * 100)}
                onPress={onSeeAll}
              />
            ))}
            {onSeeAll ? <SeeAllTile onPress={onSeeAll} /> : null}
          </ScrollView>
        </>
      ) : null}

      {summary.unpricedOrders ? (
        <Text style={styles.note}>
          {plural(summary.unpricedOrders, 'order')} without a price not counted
        </Text>
      ) : null}
    </View>
  );
}

/** "Spent in …" with an optional pill, over the big total (paise muted). */
export function SpendTotal({
  label,
  amount,
  pill,
  left,
}: {
  label: string;
  amount: number;
  pill?: string;
  /** Replaces the label (e.g. a month stepper). */
  left?: React.ReactNode;
}) {
  const counted = useCountUp(amount);
  const money = formatMoney(counted) ?? '₹0';
  const exact = formatMoney(amount) ?? '₹0';
  const dot = money.indexOf('.');
  const whole = dot > 0 ? money.slice(0, dot) : money;
  const paise = dot > 0 ? money.slice(dot) : '';
  return (
    <View>
      <View style={styles.labelRow}>
        {left ?? <Text style={styles.label}>{label}</Text>}
        {pill ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{pill}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={styles.total}
        accessibilityRole="header"
        accessibilityLabel={`${label}: ${exact}`}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {whole}
        <Text style={styles.paise}>{paise}</Text>
      </Text>
    </View>
  );
}

/** A glass stat tile on ember: icon, a number, a label. Optional select. */
export function GlassTile({
  icon,
  corner,
  value,
  label,
  selected,
  onPress,
  a11y,
}: {
  icon: React.ReactNode;
  corner?: string;
  value: string;
  label: string;
  selected?: boolean;
  onPress?: () => void;
  a11y?: string;
}) {
  const press = usePressScale(0.96);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      unstable_pressDelay={60}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y ?? `${label}, ${value}`}
    >
      <Animated.View
        style={[styles.tile, selected && styles.tileOn, press.style]}
      >
        <View style={styles.tileTop}>
          {icon}
          {corner ? (
            <Text style={[styles.share, selected && styles.shareOn]}>
              {corner}
            </Text>
          ) : null}
        </View>
        <Text
          style={[styles.tileValue, selected && styles.valueOn]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text
          style={[styles.tileLabel, selected && styles.labelOn]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CategoryTile({
  category,
  label,
  spent,
  share,
  onPress,
}: {
  category: string;
  label: string;
  spent: number;
  share: number;
  onPress?: () => void;
}) {
  const { icon: Icon, bar } = categoryStyle(category);
  return (
    <GlassTile
      icon={
        <View style={[styles.tileIcon, { backgroundColor: bar }]}>
          <Icon size={14} color={colors.ink} strokeWidth={2.2} />
        </View>
      }
      corner={`${share}%`}
      value={formatMoney(spent) ?? ''}
      label={label}
      onPress={onPress}
      a11y={`${label}, ${formatMoney(spent)}, ${share} percent`}
    />
  );
}

function SeeAllTile({ onPress }: { onPress: () => void }) {
  const press = usePressScale(0.96);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel="See all spends"
    >
      <Animated.View style={[styles.tile, styles.seeAll, press.style]}>
        <View style={styles.seeAllIcon}>
          <ArrowUpRight size={16} color={colors.ink} strokeWidth={2.4} />
        </View>
        <Text style={styles.seeAllText}>See all{'\n'}spends</Text>
      </Animated.View>
    </Pressable>
  );
}

const TILE_W = 118;

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { ...typography.body, color: colors.onEmberSubtle },
  countPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  countText: { ...typography.label, fontSize: 12, color: colors.onEmber },
  total: {
    ...display,
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: -1,
    color: colors.onEmber,
    marginTop: spacing.xxs,
  },
  paise: {
    ...font('medium'),
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.onEmberSubtle,
  },
  // Tiles bleed to the screen edge so the row reads as swipeable.
  tilesScroll: { marginHorizontal: -spacing.lg, marginTop: spacing.md },
  tiles: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  tile: {
    minWidth: TILE_W,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 2,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tileIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  share: {
    ...typography.caption,
    fontSize: 12,
    color: colors.onEmberSubtle,
    fontVariant: ['tabular-nums'],
  },
  tileValue: {
    ...font('bold'),
    fontSize: 16,
    lineHeight: 20,
    color: colors.onEmber,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: { ...typography.caption, color: colors.onEmberMuted },
  tileOn: { backgroundColor: colors.surface, borderColor: colors.surface },
  shareOn: { color: colors.textSecondary },
  valueOn: { color: colors.textPrimary },
  labelOn: { color: colors.textSecondary },
  seeAll: { width: 92, justifyContent: 'space-between' },
  seeAllIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.onEmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: {
    ...typography.label,
    fontSize: 13,
    lineHeight: 17,
    color: colors.onEmber,
  },
  note: {
    ...typography.caption,
    color: colors.onEmberSubtle,
    marginTop: spacing.sm,
  },
});
