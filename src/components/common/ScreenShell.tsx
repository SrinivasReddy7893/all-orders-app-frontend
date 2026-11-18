import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { colors, gradients, radius, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  /** Pinned to the bottom (thumb zone), above the keyboard. */
  footer?: React.ReactNode;
  onBack?: () => void;
};

/** Ember screen frame for the sign-in flow: back, scrollable body, footer. */
export function ScreenShell({ children, footer, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + spacing.xs },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <ChevronLeft size={22} color={colors.onEmber} strokeWidth={2} />
          </Pressable>
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, keyboard) + spacing.md },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundImage: gradients.ember },
  body: { paddingHorizontal: spacing.lg, flexGrow: 1 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pressed: { opacity: 0.7 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
