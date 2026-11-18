import { ROUTE_BOX, routeD, sampleRoute } from './routePath';

test('route runs from top-centre to bottom-centre of its box', () => {
  const { xs, ys, progress } = sampleRoute(100);
  expect(xs[0]).toBeCloseTo(ROUTE_BOX.width / 2);
  expect(ys[0]).toBeCloseTo(0);
  expect(xs[xs.length - 1]).toBeCloseTo(ROUTE_BOX.width / 2);
  expect(ys[ys.length - 1]).toBeCloseTo(100);
  expect(progress[0]).toBe(0);
  expect(progress[progress.length - 1]).toBe(1);
});

test('progress is strictly increasing (valid interpolation input)', () => {
  const { progress } = sampleRoute(68);
  for (let i = 1; i < progress.length; i++) {
    expect(progress[i]).toBeGreaterThan(progress[i - 1]);
  }
});

test('the route actually bends (not a straight line)', () => {
  const { xs } = sampleRoute(100);
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(40);
});

test('path data scales vertically with height', () => {
  expect(routeD(50)).toContain('90 25');
  expect(routeD(100)).toMatch(/^M90 0 C/);
});
