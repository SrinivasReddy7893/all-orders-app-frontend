import Svg, { Path } from 'react-native-svg';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import amazonIcon from '@/assets/brands/amazon.png';
import myntraIcon from '@/assets/brands/myntra.png';

import { colors, font } from '@/theme';

/**
 * Each shop's own brand colour (from its public identity), so a list of
 * orders is recognisable at a glance.
 */
const BRAND: Record<string, string> = {
  amazon: '#FF9900',
  flipkart: '#2874F0',
  myntra: '#FF3F6C',
  swiggy: '#FC8019',
  zomato: '#E23744',
  blinkit: '#F8CB46',
  zepto: '#3D0A72',
  bigbasket: '#A5CD39',
  nykaa: '#FC2779',
  ajio: '#2C4152',
  meesho: '#F43397',
  tatacliq: '#9E1F63',
  croma: '#00A99D',
  jiomart: '#0078AD',
  dmart: '#00843D',
  firstcry: '#F18A00',
  lenskart: '#000042',
  decathlon: '#0082C3',
  ikea: '#0058A3',
};

/**
 * Real logo marks where an openly licensed one exists (Simple Icons,
 * CC0, simpleicons.org). Others show their initial in brand colour.
 */
const GLYPH: Record<string, string> = {
  swiggy:
    'M12.034 24c-.376-.411-2.075-2.584-3.95-5.513-.547-.916-.901-1.63-.833-1.814.178-.48 3.355-.743 4.333-.308.298.132.29.307.29.409 0 .44-.022 1.619-.022 1.619a.441.441 0 1 0 .883-.002l-.005-2.939c0-.255-.278-.319-.331-.329-.511-.002-1.548-.006-2.661-.006-2.457 0-3.006.101-3.423-.172-.904-.591-2.383-4.577-2.417-6.819C3.849 4.964 5.723 2.225 8.362.868A8.13 8.13 0 0 1 12.026 0c4.177 0 7.617 3.153 8.075 7.209l.001.011c.084.981-5.321 1.189-6.39.904-.164-.044-.206-.212-.206-.284L13.5 4.996a.442.442 0 0 0-.884.002l.009 3.866a.33.33 0 0 0 .268.32l3.354-.001c1.79 0 2.542.207 3.042.588.333.254.461.739.349 1.37C18.633 16.755 12.273 23.71 12.034 24z',
  bigbasket:
    'M11.543 12.989a3.352 3.352 0 0 0-.871-1.375 2.251 2.251 0 0 0-1.474-.503 2.276 2.276 0 0 0-1.541.536 2.953 2.953 0 0 0-.973 1.375 5.609 5.609 0 0 0-.335 1.845 5.42 5.42 0 0 0 .335 1.809c.192.548.528 1.034.973 1.407.441.339.985.516 1.541.503a2.08 2.08 0 0 0 1.945-1.072h-.002a4.92 4.92 0 0 0 .67-2.649 6.477 6.477 0 0 0-.268-1.876zM20.381.033H3.587A3.584 3.584 0 0 0 0 3.585V20.38a3.59 3.59 0 0 0 3.587 3.586h16.794c1.986 0 3.601-1.6 3.619-3.586V3.585A3.614 3.614 0 0 0 20.381.033zM10.64 3.034h1.911v5.744a3.47 3.47 0 0 0-1.911-.584v-5.16zm-.438 17.93a5.586 5.586 0 0 1-2.278-.369 3.522 3.522 0 0 1-1.174-.804 4.18 4.18 0 0 1-.335-.536l-.033-.134v.302C6.281 21.266 3.4 20.931 3.4 20.931V3.034h3.15v7.442h.034a3.675 3.675 0 0 1 1.541-1.309 4.825 4.825 0 0 1 2.079-.435 4.197 4.197 0 0 1 2.649.871 5.263 5.263 0 0 1 1.675 2.278v-.001c.372.951.565 1.963.569 2.984a8.418 8.418 0 0 1-.571 2.984 5.47 5.47 0 0 1-1.675 2.278 4.161 4.161 0 0 1-2.649.838zm9.828-3.111a5.47 5.47 0 0 1-1.675 2.278 4.173 4.173 0 0 1-2.649.838 5.587 5.587 0 0 1-2.278-.37 4.85 4.85 0 0 1-.362-.186c.444-.36.837-.778 1.168-1.245.353.127.726.189 1.101.185 2.38 0 3.15-2.502 3.15-4.484 0-1.96-.721-4.523-3.15-4.523a3.058 3.058 0 0 0-1.021.163 6.349 6.349 0 0 0-1.017-1.166c.107-.063.218-.121.331-.176a4.72 4.72 0 0 1 6.403 2.715l-.001.004c.373.951.566 1.963.571 2.984a8.409 8.409 0 0 1-.571 2.983z',
  flipkart:
    'M3.833 1.333a.993.993 0 0 0-.333.061V1c0-.551.449-1 1-1h14.667c.551 0 1 .449 1 1v.333H3.833zm17.334 2.334H2.833c-.551 0-1 .449-1 1V23c0 .551.449 1 1 1h7.3l1.098-5.645h-2.24c-.051 0-5.158-.241-5.158-.241l4.639-.327-.078-.366-1.978-.285 1.882-.158-.124-.449-3.075-.467s3.341-.373 3.392-.373h3.232l.247-1.331c.289-1.616.945-2.807 1.973-3.693 1.033-.892 2.344-1.332 3.937-1.332.643 0 1.053.151 1.231.463.118.186.201.516.279.859.074.352.14.671.095.903-.057.345-.461.465-1.197.465h-.253c-1.327 0-2.134.763-2.405 2.31l-.243 1.355h1.54c.574 0 .781.402.622 1.306-.17.941-.539 1.36-1.111 1.36H14.9L13.804 24h7.362c.551 0 1-.449 1-1V4.667a1 1 0 0 0-.999-1zM20.5 2.333A.334.334 0 0 0 20.167 2H3.833a.334.334 0 0 0-.333.333V3h17v-.667z',
  ikea: 'M0 7.2v9.6h24V7.2H0zm12.002 9.12C5.308 16.32.48 14.36.48 12s4.831-4.32 11.522-4.32c6.69 0 11.518 1.96 11.518 4.32s-4.824 4.32-11.518 4.32zm-.225-6.062h4.176v.964c-.103-.047-.203-.047-.306-.047h-1.758v.46h1.689v.732h-1.689v.457h1.758c.103 0 .203 0 .306-.05v.967h-4.176c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.302zm-7.076.302v2.881c0 .101 0 .198.052.299H2.4c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.299h2.353c-.052.101-.052.198-.052.299zm6.447 2.881c.076.107.158.208.255.299H8.805c0-.101-.1-.306-.21-.467-.11-.161-.705-1.044-.705-1.044v1.212c0 .101 0 .198.052.299H5.778c.052-.101.052-.198.052-.299V10.56c0-.101 0-.198-.052-.299h2.164c-.052.101-.052.198-.052.299v1.259s.691-.88.85-1.085c.12-.154.268-.373.268-.473h2.257c-.155.101-.327.282-.468.45l-.826.984s1.039 1.548 1.177 1.746zm10.546-3.005a.178.178 0 0 0-.175-.178h-.21v.551h.083v-.195h.12l.11.195h.093l-.12-.212a.184.184 0 0 0 .099-.161zm-.189.101h-.114v-.191h.124c.055 0 .093.047.093.101 0 .053-.048.093-.103.09zm-.021-.457h-.031a.444.444 0 0 0-.437.457c0 .007 0 .017-.003.023a.466.466 0 0 0 .482.447.464.464 0 0 0 .458-.47v-.017a.454.454 0 0 0-.469-.44zm0 .823a.372.372 0 0 1-.375-.366v-.027a.357.357 0 0 1 .375-.339c.206 0 .375.165.375.366s-.168.366-.375.366zm-.877-.339c-.038-.101-.093-.198-.065-.299h-3.017c.014.101-.024.198-.062.299l-1.07 2.881a.852.852 0 0 1-.162.299h1.785c-.014-.101.024-.198.058-.299.034-.101.072-.198.072-.198l.021-.054h1.304l.021.05c.048.118.083.198.083.198.041.101.079.198.069.299h2.263a.837.837 0 0 1-.169-.299 690.277 690.277 0 0 0-1.131-2.877zm-2.167 1.893c.155-.42.289-.772.299-.806.028-.074.048-.151.062-.228.017.077.041.154.069.228l.316.806h-.746z',
};

/**
 * Official app icons published by the shops themselves, bundled with the
 * app (never fetched at runtime, so no third party learns what you buy).
 */
const ICON: Record<string, { source: ImageSourcePropType; scale: number }> = {
  amazon: { source: amazonIcon, scale: 0.78 },
  // Myntra's icon carries its own ring; zoom past it to the mark.
  myntra: { source: myntraIcon, scale: 1.45 },
};

/**
 * Shops with no open mark whose app icon is a solid brand tile: we echo
 * that tile (white initial on brand colour) rather than copy their art.
 */
const FILLED = new Set(['nykaa']);

const key = (vendor: string) => vendor.toLowerCase().replace(/[^a-z]/g, '');

export const brandColor = (vendor: string) => BRAND[key(vendor)] ?? '#5B4335';

/** The shop's mark on a white tile: the first thing a row is known by. */
export function ShopLogo({
  vendor,
  size = 44,
  logoUrl,
}: {
  vendor: string;
  size?: number;
  /** The shop's own logo from its emails; used only when we have no bundled mark. */
  logoUrl?: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const color = brandColor(vendor);
  const glyph = GLYPH[key(vendor)];
  const icon = ICON[key(vendor)];
  const filled = FILLED.has(key(vendor));
  const remote =
    !icon && !glyph && !filled && logoUrl && !broken ? logoUrl : null;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3 },
        filled && { backgroundColor: color, borderColor: color },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {remote ? (
        <Image
          source={{ uri: remote }}
          style={{ width: size * 0.78, height: size * 0.78 }}
          resizeMode="contain"
          onError={() => setBroken(true)}
          accessibilityIgnoresInvertColors
        />
      ) : icon ? (
        <Image
          source={icon.source}
          style={{ width: size * icon.scale, height: size * icon.scale }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : glyph ? (
        <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
          <Path d={glyph} fill={color} />
        </Svg>
      ) : (
        <Text
          style={[
            styles.initial,
            { color: filled ? colors.surface : color, fontSize: size * 0.46 },
          ]}
        >
          {vendor.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...font('bold'), includeFontPadding: false, letterSpacing: -0.5 },
});
