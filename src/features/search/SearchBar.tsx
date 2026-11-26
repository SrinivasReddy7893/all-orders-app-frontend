import { Search, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppActive } from '@/hooks/useAppActive';
import { colors, easeOut, radius, spacing, typography } from '@/theme';

/**
 * Everyday examples that make sense to anyone, one for each thing search
 * covers: products, shops, order and tracking numbers. Never the user's own
 * orders, which could show something private to whoever glances at the screen.
 */
const EXAMPLES = [
  'headphones',
  'Amazon',
  'shoes',
  'order ID',
  'Flipkart',
  'phone charger',
  'tracking number',
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  /**
   * floating: white with a shadow, over the ember header.
   * filled: a flat tinted pill, for a white header (no card-on-card).
   */
  variant?: 'floating' | 'filled';
};

/**
 * A white search pill. While empty, the example in the hint rolls up to
 * the next one every few seconds, so people learn what they can search
 * (product, shop, order number) without a help line.
 */
export function SearchBar({
  value,
  onChange,
  onFocus,
  variant = 'floating',
}: Props) {
  const [index, setIndex] = useState(0);
  const roll = useRef(new Animated.Value(0)).current;
  const reduce = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(r => (reduce.current = r));
  }, []);

  const active = useAppActive();
  useEffect(() => {
    if (value || !active) return;
    const t = setInterval(() => {
      if (reduce.current) {
        setIndex(i => (i + 1) % EXAMPLES.length);
        return;
      }
      Animated.timing(roll, {
        toValue: 1,
        duration: 220,
        easing: easeOut,
        useNativeDriver: true,
      }).start(() => {
        setIndex(i => (i + 1) % EXAMPLES.length);
        roll.setValue(-1);
        Animated.timing(roll, {
          toValue: 0,
          duration: 220,
          easing: easeOut,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);
    return () => clearInterval(t);
  }, [value, roll, active]);

  const example = EXAMPLES[index];

  return (
    <View style={[styles.bar, variant === 'filled' && styles.filled]}>
      <Search size={18} color={colors.textSecondary} strokeWidth={2.2} />
      <View style={styles.field}>
        {!value ? (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>Search </Text>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.hintText,
                styles.example,
                {
                  opacity: roll.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: roll.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [10, 0, -10],
                      }),
                    },
                  ],
                },
              ]}
            >
              “{example}”
            </Animated.Text>
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          style={styles.input}
          accessibilityLabel="Search orders by product, shop or order ID"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          selectionColor={colors.ember}
        />
      </View>
      {value ? (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}
        >
          <X size={14} color={colors.onInk} strokeWidth={2.6} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    boxShadow: '0px 4px 14px rgba(20, 4, 0, 0.18)',
  },
  filled: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
  },
  field: { flex: 1, height: '100%', justifyContent: 'center' },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    height: '100%',
  },
  hintText: { ...typography.body, color: colors.textSecondary },
  example: { flexShrink: 1, color: colors.textPrimary },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
    height: '100%',
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
