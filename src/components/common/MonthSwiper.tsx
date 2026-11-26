import React, { useRef } from 'react';
import { Animated, View, type GestureResponderEvent } from 'react-native';

import { easeOut } from '@/theme';

/** A flick this fast (dp per ms) turns the page even when it is short. */
const FLICK = 0.35;

/**
 * Swipes between pages. While the finger is down the page follows it 1:1, with
 * resistance when there is nothing further that way; on release it either
 * turns the page or springs back. Children ask `swiped()` before acting on a
 * tap, so a swipe that starts on a day never picks it. With Reduce Motion the
 * page changes without sliding.
 */
export function MonthSwiper({
  canGo,
  onGo,
  reduceMotion,
  children,
}: {
  canGo: (delta: -1 | 1) => boolean;
  onGo: (delta: -1 | 1) => void;
  reduceMotion: () => boolean;
  children: (swiped: () => boolean) => React.ReactNode;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const width = useRef(320);
  const start = useRef({ x: 0, y: 0, t: 0 });
  const dragging = useRef(false);

  const begin = (e: GestureResponderEvent) => {
    const { pageX, pageY, timestamp } = e.nativeEvent;
    x.stopAnimation();
    start.current = { x: pageX, y: pageY, t: timestamp };
    dragging.current = false;
  };

  const move = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.pageX - start.current.x;
    const dy = e.nativeEvent.pageY - start.current.y;
    if (!dragging.current) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      dragging.current = true;
    }
    if (reduceMotion()) return;
    const open = canGo(dx > 0 ? -1 : 1);
    x.setValue(open ? dx : dx * 0.2);
  };

  const end = (e: GestureResponderEvent) => {
    if (!dragging.current) return;
    const dx = e.nativeEvent.pageX - start.current.x;
    const speed =
      Math.abs(dx) / Math.max(e.nativeEvent.timestamp - start.current.t, 1);
    const delta = dx > 0 ? -1 : 1;
    const turn =
      canGo(delta) && (Math.abs(dx) > width.current * 0.25 || speed > FLICK);

    if (turn) {
      onGo(delta);
      if (reduceMotion()) return x.setValue(0);
      // The new month arrives from the side the finger was heading away from.
      x.setValue(delta * width.current * 0.35);
    }
    Animated.timing(x, {
      toValue: 0,
      duration: 220,
      easing: easeOut,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      collapsable={false}
      onLayout={e => (width.current = e.nativeEvent.layout.width)}
      onTouchStart={begin}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={() => x.setValue(0)}
    >
      <Animated.View style={{ transform: [{ translateX: x }] }}>
        {children(() => dragging.current)}
      </Animated.View>
    </View>
  );
}
