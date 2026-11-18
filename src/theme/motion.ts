import { Easing } from 'react-native';

/** Strong ease-out for UI entrances (never ease-in on UI). */
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

export const durations = {
  press: 120,
  entrance: 700,
  reducedFade: 200,
} as const;
