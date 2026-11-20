import { ChevronDown, ExternalLink, Share2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Linking,
  Share,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Order } from '@/services/api/orders';
import { usePressScale } from '@/hooks/usePressScale';
import {
  colors,
  display,
  easeOut,
  font,
  radius,
  spacing,
  typography,
} from '@/theme';

import { categoryStyle } from '../categories';
import {
  dayGroup,
  formatMoney,
  isActive,
  orderTitle,
  shareText,
  vendorName,
} from '../format';
import { ArrivalBanner } from './ArrivalBanner';
import { OrderIdCard } from './OrderId';
import { OrderTimeline } from './OrderTimeline';
import { ShopLogo } from './ShopLogo';
import { StatusBadge } from './StatusBadge';

const DRAWER = [0.32, 0.72, 0, 1] as const;

type Props = { order: Order | null; onClose: () => void };

/**
 * Everything about one order, in the order people ask for it: who and
 * when, what it is, where it stands, then the facts, with the order ID
 * last and one tap from the clipboard.
 */
export function OrderSheet({ order, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const press = usePressScale(0.97);
  const [showAll, setShowAll] = useState(false);
  // Keep showing the last order while the sheet slides away.
  const last = useRef<Order | null>(null);
  if (order) last.current = order;
  const o = last.current;

  useEffect(() => {
    setShowAll(false);
    if (!order) return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(...DRAWER),
      useNativeDriver: true,
    }).start();
  }, [order, slide]);

  // Drag the header down to dismiss: it follows the finger, then either
  // flies off (far enough, or flicked) or springs back.
  const drag = useRef(new Animated.Value(0)).current;
  const dismissRef = useRef<() => void>(() => undefined);
  const touch = useRef({ y: 0, t: 0 });
  const settle = () =>
    Animated.spring(drag, {
      toValue: 0,
      bounciness: 0,
      speed: 18,
      useNativeDriver: true,
    }).start();
  // Raw touch events (not the responder system), which reach views inside an
  // Android Modal reliably.
  const dragHandlers = {
    onTouchStart: (e: GestureResponderEvent) => {
      touch.current = {
        y: e.nativeEvent.pageY,
        t: e.nativeEvent.timestamp,
      };
    },
    onTouchMove: (e: GestureResponderEvent) =>
      drag.setValue(Math.max(0, e.nativeEvent.pageY - touch.current.y)),
    onTouchEnd: (e: GestureResponderEvent) => {
      const dy = e.nativeEvent.pageY - touch.current.y;
      const dt = Math.max(1, e.nativeEvent.timestamp - touch.current.t);
      if (dy > 110 || dy / dt > 0.6) dismissRef.current();
      else settle();
    },
    onTouchCancel: settle,
  };

  const dismiss = () =>
    Animated.timing(slide, {
      toValue: 0,
      duration: 200,
      easing: easeOut,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        drag.setValue(0);
        onClose();
      }
    });
  dismissRef.current = dismiss;

  if (!o) return null;

  const ended =
    o.isCancelled || o.status === 'RETURNED' || o.status === 'REFUNDED';
  const active = isActive(o);
  const money = formatMoney(o.amount, o.currency);
  const items = o.titles.length > 1 ? o.titles : [orderTitle(o)];
  const shownItems = showAll ? items : items.slice(0, 3);
  const hidden = items.length - shownItems.length;
  const cat = categoryStyle(o.category);
  const CatIcon = cat.icon;
  const track = o.trackingUrl;
  const facts: [string, string][] = [];
  if (money) facts.push(['Total', money]);
  if (o.deliveredAt) facts.push(['Delivered', dayGroup(o.deliveredAt).label]);
  else if (o.expectedDelivery && active)
    facts.push(['Expected', dayGroup(o.expectedDelivery).label]);
  if (o.carrier) facts.push(['Carrier', o.carrier.name]);
  if (o.trackingNumber) facts.push(['Tracking', o.trackingNumber]);

  return (
    <Modal
      visible={!!order}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismiss}
        accessibilityLabel="Close order details"
      >
        <Animated.View style={[styles.scrim, { opacity: slide }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + spacing.md,
            transform: [
              {
                translateY: Animated.add(
                  slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [560, 0],
                  }),
                  drag,
                ),
              },
            ],
          },
        ]}
      >
        <View {...dragHandlers} collapsable={false} style={styles.dragZone}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <ShopLogo vendor={o.vendor} size={44} />
            <View style={styles.headText}>
              <Text style={styles.seller} numberOfLines={1}>
                {vendorName(o.vendor)}
              </Text>
              {o.orderedAt ? (
                <Text style={styles.ordered}>
                  Ordered {dayGroup(o.orderedAt).label}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() =>
                Share.share({ message: shareText(o) }).catch(() => undefined)
              }
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Share order status"
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Share2 size={19} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={dismiss}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <X size={20} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.titleBlock}>
            {items.length > 1 ? (
              <View style={styles.itemsSection}>
                <View style={styles.itemsHead}>
                  <Text style={styles.itemsTitle}>Items</Text>
                  <View style={styles.countBubble}>
                    <Text style={styles.countBubbleText}>{items.length}</Text>
                  </View>
                  <View style={styles.headFill} />
                  <StatusBadge status={o.status} size="lg" />
                </View>
                <View style={styles.itemList}>
                  {shownItems.map((t, i) => (
                    <View
                      key={`${t}-${i}`}
                      style={[
                        styles.itemRow,
                        (i < shownItems.length - 1 || hidden > 0) &&
                          styles.itemDivider,
                      ]}
                    >
                      <View
                        style={[styles.itemTile, { backgroundColor: cat.tint }]}
                      >
                        <CatIcon size={20} color={cat.ink} strokeWidth={2} />
                      </View>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {t}
                      </Text>
                    </View>
                  ))}
                  {hidden > 0 ? (
                    <Pressable
                      onPress={() => setShowAll(true)}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${hidden} more items`}
                      style={({ pressed }) => [
                        styles.more,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.moreText}>Show {hidden} more</Text>
                      <ChevronDown
                        size={16}
                        color={colors.emberText}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : (
              <Text style={styles.titleMain}>{items[0]}</Text>
            )}
            {items.length === 1 ? (
              <View style={styles.statusRow}>
                <StatusBadge status={o.status} size="lg" />
              </View>
            ) : null}
          </View>

          {active ? <ArrivalBanner order={o} /> : null}

          {!ended ? (
            <View style={styles.timeline}>
              <OrderTimeline status={o.status} />
            </View>
          ) : null}

          {facts.length ? (
            <View style={styles.facts}>
              {facts.map(([label, value], i) => (
                <Fact key={label} label={label} last={i === facts.length - 1}>
                  {value}
                </Fact>
              ))}
            </View>
          ) : null}

          {o.orderId ? <OrderIdCard id={o.orderId} /> : null}

          {track && active ? (
            <Pressable
              onPress={() => Linking.openURL(track).catch(() => undefined)}
              onPressIn={press.onPressIn}
              onPressOut={press.onPressOut}
              accessibilityRole="link"
              accessibilityLabel="Track shipment"
            >
              <Animated.View style={[styles.track, press.style]}>
                <Text style={styles.trackText}>Track shipment</Text>
                <ExternalLink
                  size={16}
                  color={colors.onInk}
                  strokeWidth={2.2}
                />
              </Animated.View>
            </Pressable>
          ) : null}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Fact({
  label,
  children,
  last,
}: {
  label: string;
  children: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.fact, !last && styles.factDivider]}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 6, 2, 0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  // A generous touch area around the small grabber.
  dragZone: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, gap: 2 },
  seller: {
    ...font('medium'),
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  ordered: { ...typography.caption, color: colors.textSecondary },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  pressed: { opacity: 0.6 },
  titleBlock: { gap: spacing.xs },
  titleMain: {
    ...display,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  itemsSection: { gap: spacing.xs },
  itemsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headFill: { flex: 1 },
  itemsTitle: {
    ...display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  countBubble: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberText,
  },
  countBubbleText: {
    ...font('bold'),
    fontSize: 13,
    color: colors.onEmber,
    fontVariant: ['tabular-nums'],
  },
  itemList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  itemTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  moreText: { ...typography.label, color: colors.emberText },
  itemTitle: {
    ...font('medium'),
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timeline: {
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
  },
  facts: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
  },
  factDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  factLabel: { ...typography.body, color: colors.textSecondary },
  factValue: {
    ...typography.label,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  trackText: { ...typography.label, color: colors.onInk },
});
