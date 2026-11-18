import { Package } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useEntrance } from '@/hooks/useEntrance';
import {
  colors,
  gradients,
  radius,
  shadow,
  spacing,
  typography,
} from '@/theme';

import { DeliveryRoute } from './DeliveryRoute';
import { NotificationStack } from './NotificationStack';

type Props = {
  /** Height the hero may occupy; it scales down to fit, never overlaps. */
  maxHeight?: number;
};

/** Below this height the channel shortens so the hero stays legible. */
const COMPACT_BELOW = 300;

// One focal sequence (cause → effect): the stack arrives, the channel draws
// down, the order card lands, then a truck drives the order to the card.
const TIMELINE = { road: 320, card: 520, drive: 1200 };

export function InboxHero({ maxHeight }: Props) {
  const [natural, setNatural] = useState(0);
  const compact = maxHeight !== undefined && maxHeight < COMPACT_BELOW;
  const card = useEntrance(TIMELINE.card, 22);
  const arrival = useRef(new Animated.Value(0)).current;
  const scale =
    maxHeight && natural ? Math.min(1, (maxHeight - spacing.xl) / natural) : 1;

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.glow} />
      <View
        onLayout={e => setNatural(e.nativeEvent.layout.height)}
        style={[styles.content, { transform: [{ scale }] }]}
      >
        <NotificationStack />
        <View style={styles.channel}>
          <DeliveryRoute
            height={compact ? 64 : 96}
            delay={TIMELINE.road}
            driveDelay={TIMELINE.drive}
            arrival={arrival}
          />
        </View>
        <Animated.View style={[styles.card, card.style]}>
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [
                  {
                    scale: arrival.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.12],
                    }),
                  },
                ],
              },
            ]}
          >
            <Package size={20} color={colors.onEmber} strokeWidth={2} />
          </Animated.View>
          <View style={styles.cardText}>
            <Text
              maxFontSizeMultiplier={1}
              style={styles.title}
              numberOfLines={1}
            >
              Running shoes
            </Text>
            <Text
              maxFontSizeMultiplier={1}
              style={styles.status}
              numberOfLines={1}
            >
              Out for delivery · by 7 PM
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1} style={styles.price}>
            ₹2,499
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  glow: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundImage: gradients.glow,
  },
  channel: { paddingVertical: spacing.xxs },
  card: {
    width: 320,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.sm + 2,
    backgroundImage: gradients.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, marginHorizontal: spacing.sm },
  title: { ...typography.label, fontSize: 16, color: colors.textPrimary },
  status: { ...typography.caption, color: colors.emberText, marginTop: 2 },
  price: { ...typography.label, color: colors.textPrimary },
});
