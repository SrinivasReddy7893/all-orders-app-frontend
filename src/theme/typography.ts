import type { TextStyle } from 'react-native';

export const typography = {
  title: { fontSize: 22, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;
