import React from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryStyle } from '../categories';

/** The order's category as an icon on its own quiet tint. */
export function CategoryMark({
  category,
  size = 44,
}: {
  category: string;
  size?: number;
}) {
  const { icon: Icon, tint, ink } = categoryStyle(category);
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: tint,
        },
      ]}
    >
      <Icon size={size * 0.46} color={ink} strokeWidth={1.9} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
});
