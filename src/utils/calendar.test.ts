import { addMonths, clampMonth, monthAllowed } from './calendar';

const min = { y: 2025, m: 4 };
const max = { y: 2026, m: 10 };

describe('calendar months', () => {
  it('steps across a year boundary', () => {
    expect(addMonths({ y: 2026, m: 0 }, -1)).toEqual({ y: 2025, m: 11 });
    expect(addMonths({ y: 2025, m: 11 }, 1)).toEqual({ y: 2026, m: 0 });
  });

  it('allows both ends of the range and nothing past them', () => {
    expect(monthAllowed(min, min, max)).toBe(true);
    expect(monthAllowed(max, min, max)).toBe(true);
    expect(monthAllowed({ y: 2025, m: 3 }, min, max)).toBe(false);
    expect(monthAllowed({ y: 2026, m: 11 }, min, max)).toBe(false);
    expect(monthAllowed({ y: 2001, m: 0 }, undefined, max)).toBe(true);
  });

  it('pulls a year jump back into the range', () => {
    expect(clampMonth({ y: 2025, m: 0 }, min, max)).toEqual(min);
    expect(clampMonth({ y: 2026, m: 11 }, min, max)).toEqual(max);
    expect(clampMonth({ y: 2026, m: 2 }, min, max)).toEqual({ y: 2026, m: 2 });
  });
});
