import { PackageSearch, SearchX } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/common/Logo';
import { APP_NAME } from '@/constants/app';
import { SearchBar } from '@/features/search/SearchBar';
import type { MainTabParamList } from '@/navigation/types';
import { useEntrance } from '@/hooks/useEntrance';
import { useOrders } from '@/store/orders';
import { colors, display, easeOut, radius, spacing, typography } from '@/theme';

import { bySoonest, isActive, matchesQuery, orderTitle } from '../format';
import type { FilterOption } from './CategoryFilter';
import { CategoryRail } from './CategoryRail';
import { ActiveOrderCard } from './OrderCards';
import {
  EmptyState,
  OrderList,
  SectionTitle,
  sectionStyles,
} from './OrderSections';
import { SpendBreakdown } from './SpendBreakdown';
import { SyncButton } from './SyncButton';

/** Solid where the search bar sticks, so it never sits on a seam. */
const TOP = '#1A0602';
const HEADER = `linear-gradient(180deg, ${TOP} 0%, #4A1004 55%, #6E1A06 100%)`;

export function OrdersHome() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { me, orders, summary, syncing, refreshing, refresh } = useOrders();
  const head = useEntrance(0, 10);
  const body = useEntrance(90, 14);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const listFade = useRef(new Animated.Value(1)).current;

  // Fixed header over the list (brand row + search). The brand row slides
  // away with the first scroll; search stays. Its backdrop turns light
  // once the list, not the ember header, is underneath.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [brandH, setBrandH] = useState(56);
  const [barH, setBarH] = useState(132);
  const [sheetTop, setSheetTop] = useState(700);
  const [overLight, setOverLight] = useState(false);
  const edge = sheetTop - (barH - brandH);
  const lift = scrollY.interpolate({
    inputRange: [0, brandH],
    outputRange: [0, -brandH],
    extrapolate: 'clamp',
  });
  const brandFade = scrollY.interpolate({
    inputRange: [0, brandH * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  // Crossfade the white header in and out (180ms, native driver).
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

  const options = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, FilterOption>();
    for (const o of orders) {
      const c = counts.get(o.category);
      if (c) c.count += 1;
      else
        counts.set(o.category, {
          key: o.category,
          label: o.categoryLabel,
          count: 1,
        });
    }
    return [
      { key: 'ALL', label: 'All', count: orders.length },
      ...[...counts.values()].sort((a, b) => b.count - a.count),
    ];
  }, [orders]);

  // Hints come from the user's own orders, so they are always findable.
  const examples = useMemo(
    () =>
      [
        ...new Set(
          orders.map(o => orderTitle(o).split(' ').slice(0, 2).join(' ')),
        ),
      ].slice(0, 6),
    [orders],
  );

  const choose = (key: string) => {
    if (key === filter) return;
    setFilter(key);
    listFade.setValue(0.35);
    Animated.timing(listFade, {
      toValue: 1,
      duration: 180,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  };

  const visible = orders.filter(
    o => (filter === 'ALL' || o.category === filter) && matchesQuery(o, query),
  );
  const active = visible.filter(isActive).sort(bySoonest);
  const settled = visible.filter(o => !isActive(o));
  const searching = query.trim().length > 0;

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.onEmber}
            colors={[colors.ember]}
            progressViewOffset={insets.top + barH}
          />
        }
      >
        {/* Room for the fixed header, in the header's own colour. */}
        <View style={[styles.dark, { height: insets.top + barH }]} />

        <View
          style={[styles.header, searching && styles.headerCompact]}
          onLayout={e =>
            setSheetTop(
              e.nativeEvent.layout.y + e.nativeEvent.layout.height - spacing.lg,
            )
          }
        >
          {!searching ? (
            <Animated.View style={head.style}>
              {summary ? (
                <SpendBreakdown
                  summary={summary}
                  onSeeAll={() => navigation.navigate('SpendsTab')}
                />
              ) : (
                <Text style={styles.summaryEmpty}>
                  This month's spend shows up here.
                </Text>
              )}
            </Animated.View>
          ) : null}
        </View>

        <Animated.View style={[styles.sheet, body.style]}>
          {orders.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              busy={syncing}
              title={syncing ? 'Finding your orders' : 'No orders yet'}
              body={
                syncing
                  ? 'Reading order emails from shops and couriers. The first sync takes about a minute.'
                  : 'Orders appear here as shops email you. Pull down to check now.'
              }
            >
              {me?.gmail ? (
                <Text style={sectionStyles.pill}>{me.gmail.email}</Text>
              ) : null}
            </EmptyState>
          ) : (
            <CategoryRail options={options} value={filter} onChange={choose} />
          )}

          <Animated.View style={[styles.lists, { opacity: listFade }]}>
            {orders.length > 0 && visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matching orders"
                body={
                  searching
                    ? `Nothing matches “${query.trim()}”. Try a product, shop or order ID.`
                    : 'No orders in this category yet.'
                }
              />
            ) : null}

            {active.length ? (
              <View style={sectionStyles.section}>
                <SectionTitle title="On the way" count={active.length} />
                <View style={sectionStyles.cards}>
                  {active.map(o => (
                    <ActiveOrderCard key={o.id} order={o} />
                  ))}
                </View>
              </View>
            ) : null}

            {settled.length ? (
              <View style={sectionStyles.section}>
                <SectionTitle title={searching ? 'Other matches' : 'Earlier'} />
                <OrderList orders={settled} />
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Fixed header: status bar fill, brand row, search. */}
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
          style={[styles.brandRow, { opacity: brandFade }]}
          onLayout={e => setBrandH(e.nativeEvent.layout.height)}
        >
          <View style={styles.brand}>
            <Logo size={28} />
            <Text style={styles.brandName}>{APP_NAME}</Text>
          </View>
          <SyncButton />
        </Animated.View>
        <View style={styles.searchInner}>
          <SearchBar
            value={query}
            onChange={setQuery}
            examples={examples}
            variant={overLight ? 'filled' : 'floating'}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  dark: { backgroundColor: TOP },
  status: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 0, right: 0, zIndex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brandName: {
    ...display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.onEmber,
  },
  searchInner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  white: { backgroundColor: colors.surface },
  // Stuck over the list: a soft shadow lifts the header off the content.
  barRaised: { boxShadow: '0px 8px 20px rgba(60, 20, 5, 0.14)' },
  header: {
    backgroundImage: HEADER,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerCompact: { paddingTop: 0, paddingBottom: spacing.xl },
  summaryEmpty: { ...typography.body, color: colors.onEmberSubtle },
  lists: { gap: spacing.xl },
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
