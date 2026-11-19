import React from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { usePressScale } from '@/hooks/usePressScale';
import { colors, radius, spacing, typography } from '@/theme';

import { categoryStyle } from '../categories';

export type FilterOption = { key: string; label: string; count: number };

type Props = {
  options: FilterOption[];
  value: string;
  onChange: (key: string) => void;
  /** Category icons on the chips (off for plain status filters). */
  icons?: boolean;
  /** Bleed to the screen edge from this horizontal padding. */
  inset?: number;
};

/** One row of category chips. "All" first; the chosen one turns ink. */
export function CategoryFilter({
  options,
  value,
  onChange,
  icons = true,
  inset = spacing.md,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      style={{ marginHorizontal: -inset }}
      accessibilityRole="tablist"
    >
      {options.map(o => (
        <Chip
          key={o.key}
          option={o}
          selected={o.key === value}
          icon={icons}
          onPress={() => onChange(o.key)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  option,
  selected,
  icon,
  onPress,
}: {
  option: FilterOption;
  selected: boolean;
  icon: boolean;
  onPress: () => void;
}) {
  const press = usePressScale(0.96);
  const Icon =
    !icon || option.key === 'ALL' ? null : categoryStyle(option.key).icon;
  const fg = selected ? colors.onInk : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}, ${option.count} orders`}
    >
      <Animated.View
        style={[styles.chip, selected && styles.chipOn, press.style]}
      >
        {Icon ? <Icon size={15} color={fg} strokeWidth={2} /> : null}
        <Text style={[styles.label, { color: fg }]}>{option.label}</Text>
        <Text style={[styles.count, selected && styles.countOn]}>
          {option.count}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { ...typography.label, fontSize: 14 },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  countOn: { color: 'rgba(255, 255, 255, 0.6)' },
});
