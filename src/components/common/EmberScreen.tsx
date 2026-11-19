import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, easeOut, font, radius, spacing } from '@/theme';

export const EMBER_TOP = '#1A0602';
const HEADER = `linear-gradient(180deg, ${EMBER_TOP} 0%, #4A1004 55%, #6E1A06 100%)`;

export type BarVariant = 'floating' | 'filled';

type Props = {
  title: string;
  /** Controls on the title row's right (glass buttons). */
  accessory?: React.ReactNode;
  /** Pinned under the title; told whether it sits on ember or white. */
  renderSearch?: (variant: BarVariant) => React.ReactNode;
  /** Ember header content: the tab's headline numbers. */
  hero?: React.ReactNode;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * The Home layout for every tab: an ember header with the tab's headline,
 * a light rounded sheet with the content, and a fixed bar on top. Once the
 * sheet slides under the bar it fades to white with a soft shadow.
 */
export function EmberScreen({
  title,
  accessory,
  renderSearch: search,
  hero,
  children,
  refreshing,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [titleH, setTitleH] = useState(56);
  const [barH, setBarH] = useState(56);
  const [sheetTop, setSheetTop] = useState(400);
  const [overLight, setOverLight] = useState(false);

  // With a search bar the title row slides away and search stays.
  const liftH = search ? titleH : 0;
  const edge = sheetTop - (barH - liftH);
  const lift = scrollY.interpolate({
    inputRange: [0, Math.max(liftH, 1)],
    outputRange: [0, -liftH],
    extrapolate: 'clamp',
  });
  const titleFade = scrollY.interpolate({
    inputRange: [0, Math.max(liftH * 0.6, 1)],
    outputRange: [1, search ? 0 : 1],
    extrapolate: 'clamp',
  });

  const lightness = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lightness, {
      toValue: overLight ? 1 : 0,
      duration: 180,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  }, [overLight, lightness]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
        const next = e.nativeEvent.contentOffset.y > edge;
        setOverLight(prev => (prev === next ? prev : next));
      },
    },
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={overLight ? 'dark-content' : 'light-content'} />
      <Animated.ScrollView
        style={styles.scroll}
        scrollEventThrottle={16}
        onScroll={onScroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.onEmber}
              colors={[colors.ember]}
              progressViewOffset={insets.top + barH}
            />
          ) : undefined
        }
      >
        <View style={[styles.dark, { height: insets.top + barH }]} />
        <View
          style={[styles.header, !hero && styles.headerBare]}
          onLayout={e =>
            setSheetTop(
              e.nativeEvent.layout.y + e.nativeEvent.layout.height - spacing.lg,
            )
          }
        >
          {hero}
        </View>
        <View style={styles.sheet}>{children}</View>
      </Animated.ScrollView>

      <View
        pointerEvents="none"
        style={[styles.status, styles.dark, { height: insets.top }]}
      >
        <Animated.View
          style={[styles.fill, styles.white, { opacity: lightness }]}
        />
      </View>
      <Animated.View
        style={[
          styles.bar,
          styles.dark,
          overLight && styles.barRaised,
          { top: insets.top, transform: [{ translateY: lift }] },
        ]}
        onLayout={e => setBarH(e.nativeEvent.layout.height)}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, styles.white, { opacity: lightness }]}
        />
        <Animated.View
          style={[styles.titleRow, { opacity: titleFade }]}
          onLayout={e => setTitleH(e.nativeEvent.layout.height)}
        >
          <Text
            style={[styles.title, overLight && !search && styles.titleDark]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <View style={styles.accessory}>{accessory}</View>
        </Animated.View>
        {search ? (
          <View style={styles.searchRow}>
            {search(overLight ? 'filled' : 'floating')}
          </View>
        ) : (
          <View style={styles.barGap} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  dark: { backgroundColor: EMBER_TOP },
  white: { backgroundColor: colors.surface },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  status: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, right: 0, zIndex: 1 },
  barRaised: { boxShadow: '0px 8px 20px rgba(60, 20, 5, 0.14)' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 48 + spacing.sm,
  },
  title: {
    ...font('bold'),
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.onEmber,
  },
  titleDark: { color: colors.textPrimary },
  accessory: { flexDirection: 'row', gap: spacing.xs },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  barGap: { height: spacing.sm },
  header: {
    backgroundImage: HEADER,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerBare: { paddingTop: 0, paddingBottom: spacing.xl },
  sheet: {
    marginTop: -spacing.lg,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
