import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

import { easeOut } from '@/theme';

/**
 * Eases a number from where it is to `target` (first run: from 0), in
 * whole rupees, landing exactly on the real value. Honours Reduce Motion
 * by jumping straight there.
 */
export function useCountUp(target: number, duration = 850) {
  const value = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = value.addListener(({ value: v }) => setShown(v));
    return () => value.removeListener(id);
  }, [value]);

  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      if (reduce) {
        value.setValue(target);
        return;
      }
      anim = Animated.timing(value, {
        toValue: target,
        duration,
        easing: easeOut,
        useNativeDriver: false,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [target, duration, value]);

  return Math.abs(shown - target) < 0.5 ? target : Math.round(shown);
}
