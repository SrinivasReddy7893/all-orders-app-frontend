import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { doodle as d, outline } from './palette';

/** All scenes share a 280 × 170 canvas with the ground at y = 150. */
export const SCENE = { width: 280, height: 170, ground: 150 };

function Shadow({ cx, rx }: { cx: number; rx: number }) {
  return (
    <Ellipse cx={cx} cy={SCENE.ground + 2} rx={rx} ry={5} fill={d.shadow} />
  );
}

/** 1 · Placed: a phone with the product on screen and a tap on "buy". */
export function PhoneScene() {
  return (
    <Svg width={SCENE.width} height={SCENE.height}>
      <Shadow cx={142} rx={42} />
      <Rect
        x={108}
        y={22}
        width={68}
        height={124}
        rx={13}
        fill={d.paper}
        {...outline}
      />
      <Rect x={116} y={36} width={52} height={86} rx={5} fill={d.cream} />
      <Rect
        x={127}
        y={45}
        width={30}
        height={26}
        rx={5}
        fill={d.ember}
        {...outline}
        strokeWidth={2.5}
      />
      <Rect
        x={124}
        y={78}
        width={36}
        height={4}
        rx={2}
        fill={d.ink}
        opacity={0.55}
      />
      <Rect
        x={124}
        y={86}
        width={24}
        height={4}
        rx={2}
        fill={d.ink}
        opacity={0.3}
      />
      <Rect x={124} y={99} width={36} height={14} rx={7} fill={d.ink} />
      <Circle cx={142} cy={137} r={3} fill={d.ink} opacity={0.35} />
      {/* tap ripple on the buy button */}
      <Circle
        cx={160}
        cy={106}
        r={9}
        fill="none"
        stroke={d.paper}
        strokeWidth={2.5}
      />
      <Circle
        cx={160}
        cy={106}
        r={16}
        fill="none"
        stroke={d.paper}
        strokeWidth={2}
        opacity={0.5}
      />
    </Svg>
  );
}

/** 2 · Confirmed: a taped parcel, packed and ready. */
export function ParcelScene() {
  return (
    <Svg width={SCENE.width} height={SCENE.height}>
      <Shadow cx={150} rx={60} />
      <Path
        d="M98 72 L116 54 L202 54 L184 72 Z"
        fill={d.cardboardTop}
        {...outline}
      />
      <Path
        d="M184 72 L202 54 L202 128 L184 146 Z"
        fill={d.cardboardSide}
        {...outline}
      />
      <Rect
        x={98}
        y={72}
        width={86}
        height={74}
        rx={2}
        fill={d.cardboard}
        {...outline}
      />
      {/* tape across the lid and down the front */}
      <Path d="M134 72 L152 54 L164 54 L146 72 Z" fill={d.ember} />
      <Rect x={134} y={72} width={12} height={30} fill={d.ember} />
      <Rect
        x={108}
        y={124}
        width={24}
        height={4}
        rx={2}
        fill={d.ink}
        opacity={0.35}
      />
      <Rect
        x={108}
        y={132}
        width={16}
        height={4}
        rx={2}
        fill={d.ink}
        opacity={0.25}
      />
    </Svg>
  );
}

/** 3 · Shipped: a rider on a scooter with the delivery box (moves as a whole). */
export function ScooterRider() {
  return (
    <Svg width={130} height={SCENE.height}>
      <Ellipse cx={64} cy={SCENE.ground + 2} rx={52} ry={5} fill={d.shadow} />
      {/* delivery box */}
      <Rect
        x={8}
        y={70}
        width={38}
        height={34}
        rx={3}
        fill={d.ember}
        {...outline}
      />
      <Rect x={8} y={83} width={38} height={5} fill={d.paper} />
      {/* rider: jacket, arm, legs, head */}
      <Path
        d="M54 108 L62 76 Q66 64 78 68"
        fill="none"
        stroke={d.ember}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Path
        d="M70 76 L94 86"
        fill="none"
        stroke={d.emberDark}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <Path
        d="M56 110 L80 118 L90 118"
        fill="none"
        stroke={d.ink}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={74}
        cy={52}
        r={11}
        fill={d.skin}
        {...outline}
        strokeWidth={2.5}
      />
      <Path d="M63 50 Q64 37 77 39 Q87 41 85 50 Q76 45 63 50 Z" fill={d.ink} />
      <Rect x={74} y={50} width={12} height={4} rx={2} fill={d.ink} />
      {/* scooter body, shield, floorboard, handlebar, light */}
      <Path
        d="M14 128 Q16 106 44 106 L68 106 Q78 106 80 116 L84 128 Z"
        fill={d.ember}
        {...outline}
      />
      <Path
        d="M84 128 L98 84 L106 84 L106 92 L101 94 L93 128 Z"
        fill={d.ember}
        {...outline}
      />
      <Line x1={98} y1={84} x2={112} y2={80} {...outline} />
      <Circle
        cx={108}
        cy={93}
        r={4}
        fill={d.light}
        {...outline}
        strokeWidth={2}
      />
      {/* wheels */}
      <Circle cx={30} cy={136} r={14} fill={d.ink} />
      <Circle cx={30} cy={136} r={6} fill={d.paper} />
      <Circle cx={100} cy={136} r={14} fill={d.ink} />
      <Circle cx={100} cy={136} r={6} fill={d.paper} />
    </Svg>
  );
}

/** Speed lines trailing the scooter. */
export function SpeedLines() {
  return (
    <Svg width={40} height={SCENE.height}>
      <Line
        x1={6}
        y1={92}
        x2={34}
        y2={92}
        stroke={d.paper}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={14}
        y1={108}
        x2={36}
        y2={108}
        stroke={d.paper}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Line
        x1={2}
        y1={124}
        x2={28}
        y2={124}
        stroke={d.paper}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.45}
      />
    </Svg>
  );
}

/** 4 · Delivered: a little house with the parcel at the door. */
export function HouseScene() {
  return (
    <Svg width={SCENE.width} height={SCENE.height}>
      <Shadow cx={146} rx={66} />
      <Path
        d="M96 150 L96 86 L142 52 L188 86 L188 150 Z"
        fill={d.paper}
        {...outline}
      />
      <Path
        d="M86 92 L142 48 L198 92"
        fill="none"
        stroke={d.ember}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={104}
        y={98}
        width={18}
        height={16}
        rx={2}
        fill={d.cream}
        {...outline}
        strokeWidth={2.5}
      />
      <Rect
        x={128}
        y={110}
        width={28}
        height={40}
        rx={3}
        fill={d.ember}
        {...outline}
      />
      <Circle cx={150} cy={131} r={2.2} fill={d.ink} />
      {/* the parcel, delivered */}
      <Rect
        x={162}
        y={130}
        width={24}
        height={20}
        rx={2}
        fill={d.cardboard}
        {...outline}
        strokeWidth={2.5}
      />
      <Rect x={171} y={130} width={6} height={20} fill={d.ember} />
    </Svg>
  );
}
