import React from 'react';
import { Image, StyleSheet } from 'react-native';

import logo from '@/assets/images/logo.png';

type Props = {
  size?: number;
  /** squircle matches the app icon; circle is the large brand moment. */
  shape?: 'squircle' | 'circle';
};

/** The parcel "a" mark (assets sharp up to 96dp). */
export function Logo({ size = 32, shape = 'squircle' }: Props) {
  const radius = shape === 'circle' ? size / 2 : size * 0.28;
  return (
    <Image
      source={logo}
      accessibilityIgnoresInvertColors
      style={[
        styles.logo,
        shape === 'circle' && styles.circle,
        { width: size, height: size, borderRadius: radius },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  // A soft ring of light so the dark circle lifts off the dark gradient top.
  circle: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    boxShadow: '0px 10px 30px rgba(255, 110, 40, 0.28)',
  },
});
