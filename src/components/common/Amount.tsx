import React from 'react';
import { Text, type TextStyle } from 'react-native';

type Props = {
  value: number;
  style?: TextStyle;
  /** Style for the decimal part, shown lighter (e.g. "2,499" + ".00"). */
  fractionStyle?: TextStyle;
  currency?: string;
  maxFontSizeMultiplier?: number;
};

const formatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money with a de-emphasized fraction, as in the reference dashboards. */
export function Amount({
  value,
  style,
  fractionStyle,
  currency = '₹',
  maxFontSizeMultiplier,
}: Props) {
  const [whole, fraction] = formatter.format(value).split('.');
  return (
    <Text style={style} maxFontSizeMultiplier={maxFontSizeMultiplier}>
      {currency}
      {whole}
      <Text style={fractionStyle}>.{fraction}</Text>
    </Text>
  );
}
