import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePressScale } from '@/hooks/usePressScale';
import { colors, radius, shadow, typography } from '@/theme';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/** White pill with a trailing ink arrow puck — one control, one action. */
export function PrimaryButton({ label, onPress, disabled, loading }: Props) {
  const press = usePressScale();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          styles.pill,
          disabled && !loading && styles.disabled,
          press.style,
        ]}
      >
        <Text
          style={[styles.label, disabled && !loading && styles.labelDisabled]}
        >
          {label}
        </Text>
        <View
          style={[styles.puck, disabled && !loading && styles.puckDisabled]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onInk} />
          ) : (
            <ArrowRight size={20} color={colors.onInk} strokeWidth={2} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const HEIGHT = 60;
const INSET = 6;

const styles = StyleSheet.create({
  pill: {
    height: HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.onInk,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.button,
  },
  disabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    boxShadow: 'none',
  },
  labelDisabled: { color: 'rgba(255, 255, 255, 0.7)' },
  puckDisabled: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  label: { ...typography.label, fontSize: 17, color: colors.ink },
  puck: {
    position: 'absolute',
    right: INSET,
    width: HEIGHT - INSET * 2,
    height: HEIGHT - INSET * 2,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
