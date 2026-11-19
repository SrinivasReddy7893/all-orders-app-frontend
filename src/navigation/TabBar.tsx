import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  ChartPie,
  House,
  ReceiptText,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePressScale } from '@/hooks/usePressScale';
import { colors, radius, spacing, typography } from '@/theme';

const ICONS: Record<string, LucideIcon> = {
  HomeTab: House,
  OrdersTab: ReceiptText,
  SpendsTab: ChartPie,
  AccountTab: UserRound,
};

/**
 * White bar, four destinations, label always visible (Swiggy/Zomato
 * pattern). The active tab gets an ember icon on a soft pill; switching
 * is instant, since people switch tabs constantly.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented)
            navigation.navigate(route.name);
        };
        return (
          <Tab
            key={route.key}
            label={label}
            icon={ICONS[route.name] ?? House}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function Tab({
  label,
  icon: Icon,
  focused,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  focused: boolean;
  onPress: () => void;
}) {
  const press = usePressScale(0.92);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Animated.View
        style={[styles.iconWrap, focused && styles.iconOn, press.style]}
      >
        <Icon
          size={22}
          color={focused ? colors.emberText : colors.textSecondary}
          strokeWidth={focused ? 2.3 : 1.9}
        />
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: spacing.xs,
    boxShadow: '0px -4px 16px rgba(60, 20, 5, 0.05)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 52 },
  iconWrap: {
    width: 56,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: { backgroundColor: colors.emberTint },
  label: { ...typography.micro, fontSize: 12, color: colors.textSecondary },
  labelOn: { color: colors.textPrimary },
});
