import { Mail } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useEntrance } from '@/hooks/useEntrance';
import { colors, radius, spacing, typography } from '@/theme';

export const NOTIFICATION_WIDTH = 300;

/**
 * A collapsed iOS-style notification stack: the newest notification in
 * front, two earlier ones peeking out underneath as narrower, fainter edges.
 */
export function NotificationStack() {
  const front = useEntrance(0, 16);
  const behind = useEntrance(140, 6);

  return (
    <View style={styles.stack}>
      <Animated.View style={[styles.peek, styles.peekFar, behind.style]} />
      <Animated.View style={[styles.peek, styles.peekNear, behind.style]} />
      <Animated.View style={[styles.card, front.style]}>
        <View style={styles.icon}>
          <Mail size={18} color={colors.emberText} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              maxFontSizeMultiplier={1}
              style={styles.sender}
              numberOfLines={1}
            >
              Courier update
            </Text>
            <Text maxFontSizeMultiplier={1} style={styles.time}>
              now
            </Text>
          </View>
          <Text
            maxFontSizeMultiplier={1}
            style={styles.subject}
            numberOfLines={1}
          >
            Out for delivery today
          </Text>
          <Text maxFontSizeMultiplier={1} style={styles.more} numberOfLines={1}>
            2 earlier from Sneaker store
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const CARD_RADIUS = 22;
const PEEK_NEAR = 8;
const PEEK_FAR = 7;

const styles = StyleSheet.create({
  stack: { width: NOTIFICATION_WIDTH, paddingBottom: PEEK_NEAR + PEEK_FAR },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: CARD_RADIUS,
    // Frosted material: brighter at the top edge, where light would catch.
    backgroundImage:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.14) 100%)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    boxShadow: '0px 12px 28px rgba(30, 6, 0, 0.28)',
  },
  // Earlier notifications show only as slim edges below the front card
  // (the front is translucent, so anything tucked behind it would show).
  peek: {
    position: 'absolute',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  peekNear: { left: 12, right: 12, bottom: PEEK_FAR, height: PEEK_NEAR },
  peekFar: {
    left: 26,
    right: 26,
    bottom: 0,
    height: PEEK_FAR,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm - 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, marginLeft: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  sender: { ...typography.label, fontSize: 14, color: colors.onEmber, flex: 1 },
  time: { ...typography.micro, fontSize: 12, color: colors.onEmberMuted },
  subject: {
    ...typography.caption,
    fontSize: 14,
    color: colors.onEmber,
    marginTop: 1,
  },
  more: {
    ...typography.micro,
    fontSize: 12,
    color: colors.onEmberMuted,
    marginTop: 2,
  },
});
