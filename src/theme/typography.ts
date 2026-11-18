import { Platform, type TextStyle } from 'react-native';

/**
 * Helvetica Neue on iOS (ships with the OS). Helvetica can't be bundled on
 * Android (commercial licence), so Android uses the bundled Inter, the
 * closest open alternative. Inter weights are separate families, so on
 * Android we set `fontFamily` only — never `fontWeight`.
 */
type Weight = 'regular' | 'medium' | 'bold';

const IOS_WEIGHT: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  bold: '700',
};
const ANDROID_FAMILY: Record<Weight, string> = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  bold: 'Inter-Bold',
};

export const font = (weight: Weight): TextStyle =>
  Platform.select({
    ios: { fontFamily: 'Helvetica Neue', fontWeight: IOS_WEIGHT[weight] },
    default: { fontFamily: ANDROID_FAMILY[weight] },
  });

export const typography = {
  display: {
    ...font('medium'),
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.6,
  },
  title: {
    ...font('medium'),
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  body: {
    ...font('regular'),
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  label: {
    ...font('medium'),
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  caption: {
    ...font('regular'),
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -0.1,
  },
  micro: { ...font('medium'), fontSize: 11, lineHeight: 14, letterSpacing: 0 },
} as const satisfies Record<string, TextStyle>;
