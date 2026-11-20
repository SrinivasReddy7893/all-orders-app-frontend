import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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

export type DatePickSpec = {
  title: string;
  message?: string;
  /** The button's words, before the chosen date: "Mark delivered". */
  confirmLabel: string;
  tone?: 'default' | 'danger';
  /** Earliest day that can be chosen (the order date). */
  min?: Date;
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
 * Pick the day something happened: three quick choices for the usual case
 * (today, yesterday, the day before) and a month calendar for the rest.
 * Only days from the order date to today can be chosen. The button names the
 * chosen day, so confirming is also reading it back.
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

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(r => (reduce.current = r));
  }, []);

  useEffect(() => {
    if (!spec) return;
    const now = toDay(new Date());
    setPicked(now);
    setCursor({ y: now.y, m: now.m });
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

  const quick: { name: string; day: Day }[] = [0, 1, 2].map(back => ({
    name: ['Today', 'Yesterday', '2 days ago'][back],
    day: toDay(new Date(today.y, today.m, today.d - back)),
  }));

  const first = new Date(cursor.y, cursor.m, 1).getDay();
  const length = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const atNewest = cursor.y === today.y && cursor.m === today.m;
  const atOldest = !!minDay && cursor.y === minDay.y && cursor.m === minDay.m;
  const step = (delta: number) =>
    setCursor(c => {
      const next = new Date(c.y, c.m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });

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
              const ok = allowed(q.day);
              const on = same(picked, q.day);
              return (
                <Pressable
                  key={q.name}
                  disabled={!ok}
                  onPress={() => {
                    setPicked(q.day);
                    setCursor({ y: q.day.y, m: q.day.m });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: !ok }}
                  style={({ pressed }) => [
                    styles.chip,
                    on && styles.chipOn,
                    !ok && styles.chipOff,
                    pressed && ok && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {q.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.head}>
            <Step
              label="Previous month"
              disabled={atOldest}
              onPress={() => step(-1)}
            >
              <ChevronLeft
                size={20}
                color={atOldest ? colors.hairline : colors.textPrimary}
              />
            </Step>
            <Text style={styles.month} accessibilityRole="header">
              {MONTHS[cursor.m]} {cursor.y}
            </Text>
            <Step
              label="Next month"
              disabled={atNewest}
              onPress={() => step(1)}
            >
              <ChevronRight
                size={20}
                color={atNewest ? colors.hairline : colors.textPrimary}
              />
            </Step>
          </View>

          <View style={styles.week}>
            {WEEK.map((w, i) => (
              <Text key={i} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
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
                  onPress={() => setPicked(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} ${MONTHS[cursor.m]}`}
                  accessibilityState={{ selected: on, disabled: !ok }}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.day,
                        same(day, today) && styles.dayToday,
                        on && (danger ? styles.dayOnDanger : styles.dayOn),
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
  chipOff: { opacity: 0.4 },
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
