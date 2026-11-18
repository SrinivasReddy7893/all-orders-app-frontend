import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

import { durations, easeOut } from '@/theme';

/**
 * One-shot mount entrance on the native driver: rise + fade, or a short
 * fade only when the system asks for reduced motion.
 */
export function useEntrance(delay = 0, distance = 16) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let anim: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled) return;
      setReduced(reduce);
      anim = Animated.timing(progress, {
        toValue: 1,
        delay: reduce ? 0 : delay,
        duration: reduce ? durations.reducedFade : durations.entrance,
        easing: easeOut,
        useNativeDriver: true,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [delay, progress]);

  return {
    progress,
    style: {
      opacity: progress,
      transform: [
        {
          translateY: reduced
            ? 0
            : progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
        },
      ],
    },
  };
}
