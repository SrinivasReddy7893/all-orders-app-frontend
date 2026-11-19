import { LayoutGrid } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePressScale } from '@/hooks/usePressScale';
import { colors, easeOut, radius, spacing, typography } from '@/theme';

import { categoryStyle } from '../categories';
import type { FilterOption } from './CategoryFilter';

type Props = {
  options: FilterOption[];
  value: string;
  onChange: (key: string) => void;
};

type Box = { x: number; width: number };

/**
 * A quick-commerce style category rail: icon tile over a short label,
 * with one ember underline that slides to the chosen category (200ms
 * strong ease-out, native driver). Counts stay off the rail; the lists
 * below already show them.
 */
export function CategoryRail({ options, value, onChange }: Props) {
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const x = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    const box = boxes[value];
    if (!box) return;
    const width = box.width * 0.56;
    const left = box.x + (box.width - width) / 2;
    if (!placed.current) {
      x.setValue(left);
      w.setValue(width);
      placed.current = true;
      return;
    }
    Animated.parallel([
      Animated.timing(x, {
        toValue: left,
        duration: 200,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(w, {
        toValue: width,
        duration: 200,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [boxes, value, x, w]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole="tablist"
      >
        <View style={styles.spacer} />
        {options.map(o => (
          <Item
            key={o.key}
            option={o}
            selected={o.key === value}
            onPress={() => onChange(o.key)}
            onLayout={box => setBoxes(b => ({ ...b, [o.key]: box }))}
          />
        ))}
        <View style={styles.spacer} />
        {/* One indicator, scaled from a 1px bar so it stays on the GPU. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { transform: [{ translateX: x }, { scaleX: w }] },
          ]}
        />
      </ScrollView>
    </View>
  );
}

function Item({
  option,
  selected,
  onPress,
  onLayout,
}: {
  option: FilterOption;
  selected: boolean;
  onPress: () => void;
  onLayout: (box: Box) => void;
}) {
  const press = usePressScale(0.94);
  const all = option.key === 'ALL';
  const style = categoryStyle(option.key);
  const Icon = all ? LayoutGrid : style.icon;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onLayout={e =>
        onLayout({
          x: e.nativeEvent.layout.x,
          width: e.nativeEvent.layout.width,
        })
      }
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}, ${option.count} orders`}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.tile,
          { backgroundColor: all ? colors.track : style.tint },
          selected && styles.tileOn,
          press.style,
        ]}
      >
        <Icon
          size={22}
          color={
            selected ? colors.emberText : all ? colors.textPrimary : style.ink
          }
          strokeWidth={selected ? 2.3 : 1.9}
        />
      </Animated.View>
      <Text
        style={[styles.label, selected && styles.labelOn]}
        numberOfLines={1}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

const TILE = 52;

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  // No padding here: the indicator is absolute, so spacing lives in items.
  row: {},
  spacer: { width: spacing.xs },
  item: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    minWidth: 72,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileOn: {
    borderColor: colors.ember,
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 84,
  },
  labelOn: { ...typography.label, fontSize: 12, color: colors.textPrimary },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.ember,
    transformOrigin: 'left',
  },
});
