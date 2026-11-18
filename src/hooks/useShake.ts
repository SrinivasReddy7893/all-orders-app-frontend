import { useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Error shake (the passcode-wrong cue): ~320ms, damped, transform only.
 * Skipped under reduced motion; the error text carries the message alone.
 */
export function useShake(distance = 10) {
  const x = useRef(new Animated.Value(0)).current;

  const shake = async () => {
    if (await AccessibilityInfo.isReduceMotionEnabled()) return;
    const step = (toValue: number, duration: number) =>
      Animated.timing(x, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
    x.setValue(0);
    Animated.sequence([
      step(distance, 50),
      step(-distance * 0.8, 70),
      step(distance * 0.5, 70),
      step(-distance * 0.25, 60),
      step(0, 70),
    ]).start();
  };

  return { style: { transform: [{ translateX: x }] }, shake };
}
