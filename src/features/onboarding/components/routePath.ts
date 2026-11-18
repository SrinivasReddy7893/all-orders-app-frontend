/**
 * Geometry for the welcome screen's winding delivery route: two cubic
 * Bézier segments (an S-bend), sampled by arc length so a vehicle moving
 * along it travels at an even speed through the bends.
 */
export type Point = { x: number; y: number };
type Cubic = [Point, Point, Point, Point];

/** Route in a 180 × 100 box, top-centre to bottom-centre. */
const SEGMENTS: Cubic[] = [
  [
    { x: 90, y: 0 },
    { x: 180, y: 10 },
    { x: 0, y: 40 },
    { x: 90, y: 50 },
  ],
  [
    { x: 90, y: 50 },
    { x: 176, y: 60 },
    { x: 14, y: 88 },
    { x: 90, y: 100 },
  ],
];
export const ROUTE_BOX = { width: 180, height: 100 };

const cubicAt = ([p0, p1, p2, p3]: Cubic, t: number): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/** SVG path data for the route, scaled vertically to `height`. */
export function routeD(height: number): string {
  const k = height / ROUTE_BOX.height;
  const f = (p: Point) => `${p.x} ${p.y * k}`;
  const [s0, s1] = SEGMENTS;
  return `M${f(s0[0])} C${f(s0[1])} ${f(s0[2])} ${f(s0[3])} C${f(s1[1])} ${f(
    s1[2],
  )} ${f(s1[3])}`;
}

/**
 * Points along the route with their normalised distance travelled (0–1),
 * ready for an Animated interpolation inputRange/outputRange.
 */
export function sampleRoute(height: number, perSegment = 24) {
  const k = height / ROUTE_BOX.height;
  const points: Point[] = [];
  SEGMENTS.forEach((seg, si) => {
    for (let i = si === 0 ? 0 : 1; i <= perSegment; i++) {
      const p = cubicAt(seg, i / perSegment);
      points.push({ x: p.x, y: p.y * k });
    }
  });
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
  }
  const total = lengths[lengths.length - 1];
  return {
    progress: lengths.map(l => l / total),
    xs: points.map(p => p.x),
    ys: points.map(p => p.y),
  };
}
