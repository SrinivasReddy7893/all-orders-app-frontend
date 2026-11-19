import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Order } from '@/services/api/orders';
import { colors, radius, spacing, typography } from '@/theme';

import { MONTHS_LONG, plural, type DateFilter } from '../format';

type Props = {
  visible: boolean;
  orders: Order[];
  value: DateFilter | null;
  onChange: (value: DateFilter | null) => void;
  onClose: () => void;
};

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * A bottom sheet with one month at a time. Days with orders carry an
 * ember dot, so the calendar answers "when did I order?" before any tap.
 * Pick a day, or the whole month with the button.
 */
export function CalendarSheet({
  visible,
  orders,
  value,
  onChange,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: value?.year ?? now.getFullYear(),
    month: value?.month ?? now.getMonth(),
  });
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    // Open on the picked month, or on this month.
    const base = new Date();
    setCursor({
      year: value?.year ?? base.getFullYear(),
      month: value?.month ?? base.getMonth(),
    });
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(...DRAWER),
      useNativeDriver: true,
    }).start();
  }, [visible, slide, value]);

  // Orders per day in the shown month.
  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const o of orders) {
      if (!o.orderedAt) continue;
      const d = new Date(o.orderedAt);
      if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month)
        map.set(d.getDate(), (map.get(d.getDate()) ?? 0) + 1);
    }
    return map;
  }, [orders, cursor]);
  const monthTotal = [...counts.values()].reduce((a, b) => a + b, 0);

  const first = new Date(cursor.year, cursor.month, 1).getDay();
  const days = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const step = (delta: number) =>
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const isFuture = (day: number) =>
    new Date(cursor.year, cursor.month, day) > now;
  const atCurrentMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  const pick = (f: DateFilter | null) => {
    onChange(f);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close calendar"
      >
        <Animated.View style={[styles.scrim, { opacity: slide }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.md },
          {
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [480, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.grabber} />

        <View style={styles.head}>
          <IconButton label="Previous month" onPress={() => step(-1)}>
            <ChevronLeft size={20} color={colors.textPrimary} />
          </IconButton>
          <View style={styles.headText}>
            <Text style={styles.month} accessibilityRole="header">
              {MONTHS_LONG[cursor.month]} {cursor.year}
            </Text>
            <Text style={styles.monthMeta}>
              {monthTotal ? plural(monthTotal, 'order') : 'No orders'}
            </Text>
          </View>
          <IconButton
            label="Next month"
            onPress={() => step(1)}
            disabled={atCurrentMonth}
          >
            <ChevronRight
              size={20}
              color={atCurrentMonth ? colors.hairline : colors.textPrimary}
            />
          </IconButton>
        </View>

        <View style={styles.week}>
          {WEEK.map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={i} style={styles.cell} />;
            const count = counts.get(day) ?? 0;
            const selected =
              value?.kind === 'day' &&
              value.year === cursor.year &&
              value.month === cursor.month &&
              value.day === day;
            const future = isFuture(day);
            const today = atCurrentMonth && day === now.getDate();
            return (
              <Pressable
                key={i}
                style={styles.cell}
                disabled={future}
                onPress={() =>
                  pick({
                    kind: 'day',
                    year: cursor.year,
                    month: cursor.month,
                    day,
                  })
                }
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: future }}
                accessibilityLabel={`${day} ${MONTHS_LONG[cursor.month]}, ${
                  count ? plural(count, 'order') : 'no orders'
                }`}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.day,
                      today && styles.today,
                      selected && styles.daySelected,
                      pressed && !selected && styles.dayPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        future && styles.dayFuture,
                        count > 0 && styles.dayHasOrders,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    {count > 0 ? (
                      <View
                        style={[styles.dot, selected && styles.dotSelected]}
                      />
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          {value ? (
            <Pressable
              onPress={() => pick(null)}
              style={({ pressed }) => [
                styles.secondary,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>All dates</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() =>
              pick({ kind: 'month', year: cursor.year, month: cursor.month })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>
              Show all of {MONTHS_LONG[cursor.month]}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function IconButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  scrim: { flex: 1, backgroundColor: 'rgba(18, 6, 2, 0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    marginBottom: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headText: { alignItems: 'center' },
  month: { ...typography.title, color: colors.textPrimary },
  monthMeta: { ...typography.caption, color: colors.textSecondary },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { flexDirection: 'row' },
  weekday: {
    ...typography.micro,
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: colors.hairline },
  dayPressed: { backgroundColor: colors.canvas },
  daySelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayText: {
    ...typography.body,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  dayHasOrders: { ...typography.label, color: colors.textPrimary },
  dayFuture: { color: colors.hairline },
  dayTextSelected: { color: colors.onInk },
  dot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ember,
  },
  dotSelected: { backgroundColor: colors.live },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  primary: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...typography.label, color: colors.onInk },
  secondary: {
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...typography.label, color: colors.textPrimary },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
