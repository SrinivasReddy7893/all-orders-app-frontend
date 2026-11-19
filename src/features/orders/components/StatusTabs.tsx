import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, easeOut, font, typography } from '@/theme';

export type StatusTab = { key: string; label: string; count: number };

const HEIGHT = 48;
const INSET = 14;

/**
 * Filter tabs for a short, fixed list: equal columns across the full width,
 * the count as a small badge on each label, and one orange underline that
 * slides to the chosen tab. With large system text the row wraps into a grid
 * instead of shrinking labels.
 */
export function StatusTabs({
  options,
  value,
  onChange,
}: {
  options: StatusTab[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { fontScale } = useWindowDimensions();
  const wrap = fontScale >= 1.2;
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const index = Math.max(
    0,
    options.findIndex(o => o.key === value),
  );
  const tabW = width / options.length;

  useEffect(() => {
    if (!width || wrap) return;
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      if (reduce) {
        x.setValue(index * tabW);
        return;
      }
      // A new pick replaces any slide still in flight.
      anim = Animated.timing(x, {
        toValue: index * tabW,
        duration: 220,
        easing: easeOut,
        useNativeDriver: true,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [index, tabW, width, wrap, x]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={[styles.row, wrap && styles.rowWrap]}>
        {options.map(o => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${o.label}, ${o.count}`}
              style={({ pressed }) => [
                styles.tab,
                wrap && styles.tabWrap,
                wrap && on && styles.tabWrapOn,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.labelWrap}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[styles.label, on && styles.labelOn]}
                >
                  {o.label}
                </Text>
                <View style={[styles.badge, on && styles.badgeOn]}>
                  <Text style={[styles.badgeText, on && styles.badgeTextOn]}>
                    {o.count}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      {!wrap && width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: tabW - INSET * 2, transform: [{ translateX: x }] },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rowWrap: { flexWrap: 'wrap' },
  tab: {
    flex: 1,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabWrap: {
    flexBasis: '50%',
    flexGrow: 0,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabWrapOn: { borderBottomColor: colors.ember },
  pressed: { opacity: 0.6 },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: {
    ...typography.label,
    flexShrink: 1,
    fontSize: 14,
    letterSpacing: -0.2,
    color: colors.inkSoft,
  },
  labelOn: { ...font('bold'), color: colors.textPrimary },
  // The count sits beside its label, so a row reads "Delivered 3" in one go.
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  badgeOn: { backgroundColor: colors.emberText },
  badgeText: {
    ...font('bold'),
    fontSize: 12,
    lineHeight: 15,
    color: colors.emberText,
    fontVariant: ['tabular-nums'],
  },
  badgeTextOn: { color: colors.onEmber },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: INSET,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.ember,
  },
});
