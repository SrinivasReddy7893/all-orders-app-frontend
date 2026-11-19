import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

import { useToast } from '@/components/common/Toast';
import { usePressScale } from '@/hooks/usePressScale';
import { useOrders } from '@/store/orders';
import { colors, radius } from '@/theme';

/**
 * Checks Gmail for new orders now. The icon spins (linear, constant
 * motion) only while the sync runs; a toast confirms when it is done.
 */
export function SyncButton() {
  const { refresh, refreshing } = useOrders();
  const toast = useToast();
  const press = usePressScale(0.92);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [refreshing, spin]);

  const sync = async () => {
    if (refreshing) return;
    await refresh();
    toast('Orders up to date');
  };

  return (
    <Pressable
      onPress={sync}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={refreshing}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Check Gmail for new orders"
      accessibilityState={{ busy: refreshing }}
    >
      <Animated.View style={[styles.button, press.style]}>
        <Animated.View
          style={{
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <RefreshCw size={18} color={colors.onEmber} strokeWidth={2.2} />
        </Animated.View>
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
});
