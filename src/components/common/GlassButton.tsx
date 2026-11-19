import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { usePressScale } from '@/hooks/usePressScale';
import { colors, radius } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  /** On: solid white, so an active filter reads at a glance. */
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

/** Round glass button for the ember header (same as Home's sync). */
export function GlassButton({
  label,
  onPress,
  active,
  disabled,
  children,
}: Props) {
  const press = usePressScale(0.92);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
    >
      <Animated.View
        style={[
          styles.button,
          active && styles.active,
          disabled && styles.disabled,
          press.style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.surface, borderColor: colors.surface },
  disabled: { opacity: 0.4 },
});
