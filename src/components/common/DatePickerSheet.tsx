import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  display,
  durations,
  easeOut,
  font,
  radius,
  spacing,
  typography,
} from '@/theme';
import { addMonths, clampMonth, monthAllowed } from '@/utils/calendar';

import { MonthSwiper } from './MonthSwiper';

export type DatePickSpec = {
  title: string;
  message?: string;
  /** The button's words, before the chosen date: "Mark delivered". */
  confirmLabel: string;
  tone?: 'default' | 'danger';
  /** Earliest day that can be chosen (the order date). */
  min?: Date;
  /** Days worth one tap, such as when the order was expected. */
  shortcuts?: { label: string; date: Date }[];
  /** Receives the chosen day as YYYY-MM-DD, in the phone's calendar. */
  onPick: (day: string) => void;
};

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Day = { y: number; m: number; d: number };

const startOfDay = (x: Date) =>
  new Date(x.getFullYear(), x.getMonth(), x.getDate());
const toDay = (x: Date): Day => ({
  y: x.getFullYear(),
  m: x.getMonth(),
  d: x.getDate(),
});
const same = (a: Day, b: Day) => a.y === b.y && a.m === b.m && a.d === b.d;
const ymd = (x: Day) =>
  `${x.y}-${String(x.m + 1).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
const label = (x: Day) => {
  const date = new Date(x.y, x.m, x.d);
  return `${DAYS_SHORT[date.getDay()]}, ${x.d} ${MONTHS[x.m].slice(0, 3)}`;
};

/**
 * Pick the day something happened: quick choices for the usual cases, and a
 * calendar for the rest. Swipe or use the arrows to move a month; tap the
 * month's name to jump to any month or year at once. Only days from the order
 * date to today can be chosen. The button names the chosen day, so confirming
 * is also reading it back.
 */
export function DatePickerSheet({
  spec,
  onClose,
}: {
  spec: DatePickSpec | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const reduce = useRef(false);
  const today = toDay(new Date());
  const [picked, setPicked] = useState<Day>(today);
  const [cursor, setCursor] = useState({ y: today.y, m: today.m });
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(r => (reduce.current = r));
  }, []);

  useEffect(() => {
    if (!spec) return;
    const now = toDay(new Date());
    setPicked(now);
    setCursor({ y: now.y, m: now.m });
    setJumping(false);
    anim.stopAnimation();
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: reduce.current ? durations.reducedFade : 260,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [spec, anim]);

  const dismiss = (then?: () => void) => {
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: 0,
      duration: reduce.current ? durations.reducedFade : 160,
      easing: easeOut,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      then?.();
    });
  };

  if (!spec) return null;

  const minDay = spec.min ? toDay(startOfDay(spec.min)) : undefined;
  const allowed = (x: Day) => {
    const t = new Date(x.y, x.m, x.d).getTime();
    return (
      t <= startOfDay(new Date()).getTime() &&
      (!minDay || t >= new Date(minDay.y, minDay.m, minDay.d).getTime())
    );
  };

  const yesterday = toDay(new Date(today.y, today.m, today.d - 1));
  // Today, yesterday, then whatever the caller knows, skipping repeats.
  const quick: { name: string; day: Day }[] = [
    { name: 'Today', day: today },
    { name: 'Yesterday', day: yesterday },
    ...(spec.shortcuts ?? []).map(x => ({
      name: x.label,
      day: toDay(x.date),
    })),
  ]
    .filter(
      (q, i, all) =>
        allowed(q.day) && all.findIndex(o => same(o.day, q.day)) === i,
    )
    .slice(0, 3);

  const first = new Date(cursor.y, cursor.m, 1).getDay();
  const length = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length }, (_, i) => i + 1),
  ];
  // Always six weeks, so the sheet never changes height between months.
  while (cells.length < 42) cells.push(null);

  const newest = { y: today.y, m: today.m };
  const oldest = minDay ? { y: minDay.y, m: minDay.m } : undefined;
  const canGo = (delta: number) =>
    monthAllowed(addMonths(cursor, delta), oldest, newest);
  const step = (delta: number) => {
    if (canGo(delta)) setCursor(c => addMonths(c, delta));
  };
  // In the month view the arrows move a whole year.
  const yearOpen = (delta: number) =>
    delta < 0 ? !oldest || cursor.y > oldest.y : cursor.y < newest.y;
  const stepYear = (delta: number) =>
    setCursor(c => clampMonth({ y: c.y + delta, m: c.m }, oldest, newest));
  const backOpen = jumping ? yearOpen(-1) : canGo(-1);
  const nextOpen = jumping ? yearOpen(1) : canGo(1);

  const danger = spec.tone === 'danger';
  const rise = reduce.current ? 0 : 56;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => dismiss()}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: anim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => dismiss()}
            accessibilityLabel="Close"
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.md },
            {
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [rise, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title} accessibilityRole="header">
            {spec.title}
          </Text>
          {spec.message ? (
            <Text style={styles.message}>{spec.message}</Text>
          ) : null}

          <View style={styles.quick}>
            {quick.map(q => {
              const on = same(picked, q.day);
              return (
                <Pressable
                  key={q.name}
                  onPress={() => {
                    setPicked(q.day);
                    setCursor({ y: q.day.y, m: q.day.m });
                    setJumping(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={({ pressed }) => [
                    styles.chip,
                    on && styles.chipOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.chipText, on && styles.chipTextOn]}
                    numberOfLines={1}
                  >
                    {q.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.head}>
            <Step
              label={jumping ? 'Previous year' : 'Previous month'}
              disabled={!backOpen}
              onPress={() => (jumping ? stepYear(-1) : step(-1))}
            >
              <ChevronLeft
                size={20}
                color={backOpen ? colors.textPrimary : colors.hairline}
              />
            </Step>
            <Pressable
              onPress={() => setJumping(j => !j)}
              accessibilityRole="button"
              accessibilityLabel={`${MONTHS[cursor.m]} ${cursor.y}`}
              accessibilityHint={
                jumping ? 'Back to the days' : 'Choose a month and year'
              }
              accessibilityState={{ expanded: jumping }}
              style={({ pressed }) => [styles.jump, pressed && styles.pressed]}
            >
              <Text style={styles.month}>
                {jumping ? cursor.y : `${MONTHS[cursor.m]} ${cursor.y}`}
              </Text>
              <ChevronDown
                size={18}
                color={colors.emberText}
                strokeWidth={2.4}
                style={jumping ? styles.flipped : undefined}
              />
            </Pressable>
            <Step
              label={jumping ? 'Next year' : 'Next month'}
              disabled={!nextOpen}
              onPress={() => (jumping ? stepYear(1) : step(1))}
            >
              <ChevronRight
                size={20}
                color={nextOpen ? colors.textPrimary : colors.hairline}
              />
            </Step>
          </View>

          <View style={styles.body}>
            {jumping ? (
              <View style={styles.months}>
                {MONTHS.map((name, m) => {
                  const ok = monthAllowed({ y: cursor.y, m }, oldest, newest);
                  const on = m === cursor.m;
                  return (
                    <View key={name} style={styles.monthCell}>
                      <Pressable
                        disabled={!ok}
                        onPress={() => {
                          setCursor({ y: cursor.y, m });
                          setJumping(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${name} ${cursor.y}`}
                        accessibilityState={{ selected: on, disabled: !ok }}
                        style={({ pressed }) => [
                          styles.monthChip,
                          on && styles.monthChipOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthText,
                            !ok && styles.dayOff,
                            on && styles.dayTextOn,
                          ]}
                        >
                          {name.slice(0, 3)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <>
                <View style={styles.week}>
                  {WEEK.map((w, i) => (
                    <Text key={i} style={styles.weekday}>
                      {w}
                    </Text>
                  ))}
                </View>
                <MonthSwiper
                  canGo={canGo}
                  onGo={step}
                  reduceMotion={() => reduce.current}
                >
                  {swiped => (
                    <View style={styles.grid}>
                      {cells.map((n, i) => {
                        if (!n) return <View key={i} style={styles.cell} />;
                        const day = { y: cursor.y, m: cursor.m, d: n };
                        const ok = allowed(day);
                        const on = same(picked, day);
                        return (
                          <Pressable
                            key={i}
                            style={styles.cell}
                            disabled={!ok}
                            onPress={() => {
                              if (!swiped()) setPicked(day);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${n} ${MONTHS[cursor.m]}`}
                            accessibilityState={{
                              selected: on,
                              disabled: !ok,
                            }}
                          >
                            {({ pressed }) => (
                              <View
                                style={[
                                  styles.day,
                                  same(day, today) && styles.dayToday,
                                  on &&
                                    (danger
                                      ? styles.dayOnDanger
                                      : styles.dayOn),
                                  pressed && !on && ok && styles.dayPressed,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dayText,
                                    !ok && styles.dayOff,
                                    on && styles.dayTextOn,
                                  ]}
                                >
                                  {n}
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </MonthSwiper>
              </>
            )}
          </View>

          <Pressable
            onPress={() => dismiss(() => spec.onPick(ymd(picked)))}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.confirm,
              danger && styles.confirmDanger,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmText}>
              {spec.confirmLabel} · {label(picked)}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Step({
  label: text,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 20, 16, 0.52)',
  },
  sheet: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    boxShadow: '0px -12px 32px rgba(60, 20, 5, 0.16)',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    marginBottom: spacing.sm,
  },
  title: {
    ...display,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quick: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  chip: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.emberTint, borderColor: colors.emberTint },
  chipText: { ...font('medium'), fontSize: 14, color: colors.textPrimary },
  chipTextOn: { ...font('bold'), color: colors.emberText },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  month: { ...typography.label, color: colors.textPrimary },
  jump: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.emberTint,
  },
  flipped: { transform: [{ rotate: '180deg' }] },
  // Weekday row plus six weeks, shared by the day and month views.
  body: { height: 28 + 6 * 46, overflow: 'hidden' },
  months: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: '33.333%', height: '25%', padding: spacing.xxs },
  monthChip: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  monthChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  monthText: { ...typography.label, color: colors.textPrimary },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  week: { flexDirection: 'row' },
  weekday: {
    ...typography.micro,
    height: 28,
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Every day carries a border (clear unless today or chosen), so Android
  // always draws the full circle instead of a square on a filled day.
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderColor: colors.border },
  dayPressed: { backgroundColor: colors.canvas },
  dayOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayOnDanger: {
    backgroundColor: colors.dangerText,
    borderColor: colors.dangerText,
  },
  dayText: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  dayOff: { color: colors.hairline },
  dayTextOn: { color: colors.onInk },
  confirm: {
    minHeight: 52,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  confirmDanger: { backgroundColor: colors.dangerText },
  confirmText: { ...font('bold'), fontSize: 15, color: colors.onInk },
  pressed: { opacity: 0.7 },
});
