import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

import { easeOut } from '@/theme';

/**
 * A short fade-and-rise (200ms, ease-out) each time `key` changes, so a
 * filtered list settles in instead of snapping. Skips the first render and
 * does nothing under Reduce Motion. Opacity and translate only.
 */
export function useSwapIn(key: string) {
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled || reduce) return;
      v.setValue(0);
      anim = Animated.timing(v, {
        toValue: 1,
        duration: 200,
        easing: easeOut,
        useNativeDriver: true,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [key, v]);

  return {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [
      {
        translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
      },
    ],
  };
}
