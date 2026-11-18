import React, { forwardRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

import { useShake } from '@/hooks/useShake';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  busy?: boolean;
  shake: ReturnType<typeof useShake>['style'];
};

/**
 * Six boxes drawn over one real, transparent input: taps open the keyboard,
 * and SMS autofill and paste work like any text field.
 */
export const CodeInput = forwardRef<
  React.ComponentRef<typeof TextInput>,
  Props
>(function CodeBoxes({ value, onChange, length = 6, error, busy, shake }, ref) {
  return (
    <Animated.View style={[styles.boxes, shake]}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[
            styles.box,
            !!value[i] && styles.boxFilled,
            i === value.length && !busy && styles.boxActive,
            error && styles.boxError,
          ]}
        >
          <Text style={styles.digit}>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={length}
        accessibilityLabel={`${length}-digit code`}
        caretHidden
        style={styles.overlay}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  box: {
    flex: 1,
    maxWidth: 50,
    height: 60,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  boxFilled: { backgroundColor: '#FFF4EE', borderColor: '#FFF4EE' },
  boxActive: { borderColor: colors.ink },
  boxError: { borderColor: colors.emberText },
  digit: { ...typography.title, fontSize: 24, color: colors.textPrimary },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: 'transparent',
    opacity: 0.011,
  },
});
