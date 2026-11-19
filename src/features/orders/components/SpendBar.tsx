import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { easeOut, spacing } from '@/theme';

export type BarSegment = { key: string; spent: number; color: string };

/**
 * The month's shape as one segmented bar. On first show, and whenever
 * `animateKey` changes (a new month), the segments fill left to right in
 * turn, so the eye reads the biggest slice first. Native-driven.
 */
export function SpendBar({
  segments,
  total,
  animateKey,
}: {
  segments: BarSegment[];
  total: number;
  animateKey: string;
}) {
  const fills = useRef<Animated.Value[]>([]);
  while (fills.current.length < segments.length) {
    fills.current.push(new Animated.Value(0));
  }

  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    const values = fills.current.slice(0, segments.length);
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      if (reduce) {
        values.forEach(v => v.setValue(1));
        return;
      }
      values.forEach(v => v.setValue(0));
      anim = Animated.stagger(
        70,
        values.map(v =>
          Animated.timing(v, {
            toValue: 1,
            duration: 520,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ),
      );
      anim.start();
    });
    return () => {
      cancelled = true;
      anim?.stop();
    };
    // Re-run for a new month, or when the number of slices changes.
  }, [animateKey, segments.length]);

  return (
    <View
      style={styles.bar}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {segments.map((s, i) => (
        <Animated.View
          key={s.key}
          style={[
            styles.segment,
            {
              flex: Math.max(s.spent, total * 0.02),
              backgroundColor: s.color,
              transform: [{ scaleX: fills.current[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 3, height: 10, marginTop: spacing.md },
  segment: { borderRadius: 5, transformOrigin: 'left' },
});
