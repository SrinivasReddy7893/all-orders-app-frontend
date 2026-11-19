import { CircleCheck } from 'lucide-react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, easeOut, radius, spacing, typography } from '@/theme';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Space the tab bar takes, so the toast sits just above it. */
const TAB_BAR_CLEARANCE = 76;

/**
 * One quiet pill above the tab bar. A new toast replaces the current one
 * (no stacking for a "copied" confirmation); enter 220ms, exit 160ms.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string>();
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (text: string) => {
      setMessage(text);
      AccessibilityInfo.announceForAccessibility(text);
      clearTimeout(timer.current);
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: easeOut,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 160,
          easing: easeOut,
          useNativeDriver: true,
        }).start(() => setMessage(undefined));
      }, 1600);
    },
    [anim],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: insets.bottom + TAB_BAR_CLEARANCE },
            {
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <CircleCheck size={16} color={colors.live} strokeWidth={2.2} />
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.25)',
  },
  text: { ...typography.label, fontSize: 14, color: colors.onInk },
});
