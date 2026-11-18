import { useIsFocused } from '@react-navigation/native';
import { Truck } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, durations, easeOut } from '@/theme';

import { ROUTE_BOX, routeD, sampleRoute } from './routePath';

type Props = {
  height: number;
  /** When the route fades in (ms after mount). */
  delay: number;
  /** When the first truck sets off (ms after mount). */
  driveDelay: number;
  /** Driven 0 → 1 → 0 the moment a truck arrives, for the card's "received" pop. */
  arrival: Animated.Value;
};

const PUCK = 28;
const DRIVE_MS = 1500;
const DROP_MS = 200;
const REST_MS = 900;
const APPEAR_MS = 200;

/** Moving between two points: pull away, cruise, ease into the stop. */
const driveEase = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * A winding, map-style dotted route from the notifications to the order
 * card. A delivery truck pulls away from the start marker, follows the
 * bends at an even speed, and drops into the card, which pops as it
 * "receives" the order. Loops with a rest; pauses when the screen is not
 * focused; parks the truck mid-route under reduced motion.
 */
export function DeliveryRoute({ height, delay, driveDelay, arrival }: Props) {
  const focused = useIsFocused();
  const draw = useRef(new Animated.Value(0)).current;
  const drive = useRef(new Animated.Value(0)).current;
  const visible = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState<boolean>();
  const d = useMemo(() => routeD(height), [height]);
  const samples = useMemo(() => sampleRoute(height), [height]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  useEffect(() => {
    if (reduced === undefined) return;
    const anim = Animated.timing(draw, {
      toValue: 1,
      delay: reduced ? 0 : delay,
      duration: reduced ? durations.reducedFade : 420,
      easing: easeOut,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, draw]);

  useEffect(() => {
    if (reduced !== false || !focused) return;
    const t = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      easing = easeOut,
    ) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      });

    drive.setValue(0);
    visible.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([t(visible, 1, APPEAR_MS), t(drive, 0, 0)]),
        t(drive, 1, DRIVE_MS, driveEase),
        // Drop into the card: the truck fades as the parcel pops.
        Animated.parallel([
          t(visible, 0, DROP_MS),
          Animated.sequence([t(arrival, 1, 110), t(arrival, 0, 260)]),
        ]),
        Animated.delay(REST_MS),
      ]),
    );
    const start = setTimeout(() => loop.start(), driveDelay);
    return () => {
      clearTimeout(start);
      loop.stop();
      arrival.setValue(0);
    };
  }, [reduced, focused, driveDelay, drive, visible, arrival]);

  // Interpolate along arc-length samples: even speed through the bends.
  const along = (outputs: number[]) =>
    drive.interpolate({ inputRange: samples.progress, outputRange: outputs });
  const translateX = along(samples.xs.map(x => x - PUCK / 2));
  const translateY = along(samples.ys.map(y => y - PUCK / 2));
  const mid = Math.floor(samples.xs.length / 2);

  const puckStyle = reduced
    ? {
        transform: [
          { translateX: samples.xs[mid] - PUCK / 2 },
          { translateY: samples.ys[mid] - PUCK / 2 },
        ],
      }
    : {
        opacity: visible,
        transform: [
          { translateX },
          { translateY },
          // Shrinks slightly as it drops into the card.
          {
            scale: visible.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
          },
        ],
      };

  return (
    <View style={{ width: ROUTE_BOX.width, height }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: draw }]}>
        <Svg width={ROUTE_BOX.width} height={height}>
          {/* Dots, like a map route: zero-length dashes with round caps. */}
          <Path
            d={d}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray="0 9"
            fill="none"
          />
          {/* Start marker under the notifications. */}
          <Circle
            cx={ROUTE_BOX.width / 2}
            cy={5}
            r={4}
            fill="rgba(255, 255, 255, 0.25)"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth={1.5}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.puck, puckStyle]}>
        <Truck size={16} color={colors.emberText} strokeWidth={2.2} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  puck: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PUCK,
    height: PUCK,
    borderRadius: PUCK / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 0px 14px 2px rgba(255, 160, 100, 0.55)',
  },
});
