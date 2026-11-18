import { useRef } from 'react';
import { Animated } from 'react-native';

import { durations, easeOut } from '@/theme';

/** Press feedback on touch-down: scale to 0.97 in 120ms, back on release. */
export function usePressScale(pressed = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: durations.press,
      easing: easeOut,
      useNativeDriver: true,
    }).start();

  return {
    style: { transform: [{ scale }] },
    onPressIn: () => to(pressed),
    onPressOut: () => to(1),
  };
}
