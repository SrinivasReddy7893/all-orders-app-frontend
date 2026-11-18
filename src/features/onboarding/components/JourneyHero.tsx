import { useIsFocused } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import { colors, easeOut, gradients, spacing, typography } from '@/theme';

import { doodle } from './doodles/palette';
import {
  HouseScene,
  ParcelScene,
  PhoneScene,
  SCENE,
  ScooterRider,
  SpeedLines,
} from './doodles/Scenes';

const STEPS = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
const STEP_COL = 76;
const PILL = 18;

type Props = {
  /** Height the hero may occupy; it scales down to fit, never overlaps. */
  maxHeight?: number;
};

/**
 * One order's journey as doodle scenes: placed on a phone, packed into a
 * parcel, ridden over on a scooter, left at the door. A single timeline
 * value (`stage`, 0 → 3) drives every scene, the rider and the step labels
 * on the native driver. Loops with a hold on "Delivered", pauses off-screen,
 * and shows the still "Shipped" scene under reduced motion.
 */
export function JourneyHero({ maxHeight }: Props) {
  const focused = useIsFocused();
  const stage = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState<boolean>();
  const [natural, setNatural] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  useEffect(() => {
    if (reduced === undefined) return;
    if (reduced) {
      stage.setValue(2);
      content.setValue(1);
      return;
    }
    if (!focused) return;
    const to = (
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

    stage.setValue(0);
    content.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        to(content, 1, 320),
        Animated.delay(1000),
        to(stage, 1, 480),
        Animated.delay(1000),
        to(stage, 2, 520),
        // the ride: cruise across the scene, then hand over to the door
        to(stage, 2.45, 1100, Easing.linear),
        to(stage, 3, 600),
        Animated.delay(1600),
        to(content, 0, 260),
        to(stage, 0, 0),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, focused, stage, content]);

  // Scenes cross-fade in sequence; the house waits until the rider has
  // nearly left so the two never muddle together.
  const sceneStyle = (i: number) => {
    const win = i === 3 ? [2.78, 3, 3.5] : [i - 0.5, i, i + 0.5];
    return {
      opacity: stage.interpolate({
        inputRange: win,
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: stage.interpolate({
            inputRange: win,
            outputRange: [0.92, 1, 0.96],
            extrapolate: 'clamp',
          }),
        },
        {
          translateY: stage.interpolate({
            inputRange: win,
            outputRange: [10, 0, -6],
            extrapolate: 'clamp',
          }),
        },
      ],
    } as const;
  };

  // The rider enters from the left, cruises, and exits right.
  const riderX = stage.interpolate({
    inputRange: [1.5, 2, 2.45, 2.85],
    outputRange: [-170, 70, 104, 330],
    extrapolate: 'clamp',
  });
  const riderOpacity = stage.interpolate({
    inputRange: [1.5, 1.7, 2.68, 2.82],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const speedOpacity = stage.interpolate({
    inputRange: [1.6, 1.9, 2.5, 2.8],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  // A gentle road bob while riding.
  const riderBob = stage.interpolate({
    inputRange: [2, 2.1, 2.2, 2.3, 2.4, 2.45],
    outputRange: [0, -2, 0, -2, 0, -1],
    extrapolate: 'clamp',
  });
  const badge = stage.interpolate({
    inputRange: [2.8, 2.95, 3],
    outputRange: [0, 1.15, 1],
    extrapolate: 'clamp',
  });
  const pillX = stage.interpolate({
    inputRange: [0, 3],
    outputRange: [STEP_COL / 2 - PILL / 2, STEP_COL * 3.5 - PILL / 2],
  });

  const scale =
    maxHeight && natural ? Math.min(1, (maxHeight - spacing.lg) / natural) : 1;

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.glow} />
      <Animated.View
        onLayout={e => setNatural(e.nativeEvent.layout.height)}
        style={{ opacity: content, transform: [{ scale }] }}
      >
        <View style={styles.stage}>
          {/* the road everything stands on */}
          <View style={styles.road} />
          <Animated.View style={[styles.scene, sceneStyle(0)]}>
            <PhoneScene />
          </Animated.View>
          <Animated.View style={[styles.scene, sceneStyle(1)]}>
            <ParcelScene />
          </Animated.View>
          <Animated.View style={[styles.scene, sceneStyle(3)]}>
            <HouseScene />
          </Animated.View>
          <Animated.View
            style={[
              styles.rider,
              {
                opacity: riderOpacity,
                transform: [{ translateX: riderX }, { translateY: riderBob }],
              },
            ]}
          >
            <Animated.View style={[styles.speed, { opacity: speedOpacity }]}>
              <SpeedLines />
            </Animated.View>
            <ScooterRider />
          </Animated.View>
          {/* "done" badge for Confirmed and Delivered moments */}
          <Animated.View
            style={[
              styles.badge,
              { opacity: badge, transform: [{ scale: badge }] },
            ]}
          >
            <Check size={16} color={colors.onEmber} strokeWidth={3} />
          </Animated.View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <Animated.Text
              key={step}
              maxFontSizeMultiplier={1}
              style={[
                styles.step,
                {
                  opacity: stage.interpolate({
                    inputRange: [i - 0.6, i, i + 0.6],
                    outputRange: [0.5, 1, 0.5],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              {step}
            </Animated.Text>
          ))}
          <Animated.View
            style={[styles.pill, { transform: [{ translateX: pillX }] }]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundImage: gradients.glow,
  },
  stage: { width: SCENE.width + 24, height: SCENE.height, overflow: 'hidden' },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCENE.ground + 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  scene: { position: 'absolute', left: 12, top: 0 },
  rider: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
  speed: { marginRight: -6 },
  badge: {
    position: 'absolute',
    left: 196,
    top: 34,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: doodle.ink,
    borderWidth: 2.5,
    borderColor: colors.onEmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    width: STEP_COL * 4,
    flexDirection: 'row',
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingBottom: 10,
  },
  step: {
    ...typography.micro,
    fontSize: 12,
    width: STEP_COL,
    textAlign: 'center',
    color: colors.onEmber,
  },
  pill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PILL,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.onEmber,
  },
});
