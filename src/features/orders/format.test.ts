import type { Order } from '@/services/api/orders';

import {
  arrival,
  matchesDate,
  matchesQuery,
  formatDay,
  formatMoney,
  orderHeadline,
  trackStep,
} from './format';

describe('formatMoney', () => {
  it('groups digits the Indian way', () => {
    expect(formatMoney(123456)).toBe('₹1,23,456');
    expect(formatMoney(12345678.5)).toBe('₹1,23,45,678.50');
    expect(formatMoney(999)).toBe('₹999');
  });
  it('returns null when there is no amount', () => {
    expect(formatMoney(null)).toBeNull();
  });
});

describe('formatDay', () => {
  const now = new Date(2026, 10, 19, 15);
  it('names nearby days', () => {
    expect(formatDay(new Date(2026, 10, 19, 9).toISOString(), now)).toBe(
      'Today',
    );
    expect(formatDay(new Date(2026, 10, 20, 9).toISOString(), now)).toBe(
      'Tomorrow',
    );
  });
  it('writes other days short', () => {
    expect(formatDay(new Date(2026, 10, 26).toISOString(), now)).toBe(
      'Thu, 26 Nov',
    );
  });
});

describe('trackStep', () => {
  it('maps statuses onto four stops', () => {
    expect(trackStep('PLACED')).toBe(0);
    expect(trackStep('PROCESSING')).toBe(1);
    expect(trackStep('OUT_FOR_DELIVERY')).toBe(2);
    expect(trackStep('DELIVERED')).toBe(3);
  });
});

describe('orderHeadline', () => {
  const now = new Date(2026, 10, 19, 15);
  const base = {
    status: 'SHIPPED',
    isDelivered: false,
    isCancelled: false,
  } as Order;
  it('keeps dates readable inside a sentence', () => {
    expect(
      orderHeadline(
        { ...base, expectedDelivery: new Date(2026, 10, 20).toISOString() },
        now,
      ),
    ).toBe('Arrives tomorrow');
    expect(
      orderHeadline(
        { ...base, expectedDelivery: new Date(2026, 10, 26).toISOString() },
        now,
      ),
    ).toBe('Arrives Thu, 26 Nov');
  });
});

describe('arrival', () => {
  const now = new Date(2026, 10, 19, 15);
  const base = {
    status: 'SHIPPED',
    isDelivered: false,
    isCancelled: false,
  } as Order;
  it('rates urgency for the badge', () => {
    expect(arrival({ ...base, status: 'OUT_FOR_DELIVERY' }, now).tone).toBe(
      'now',
    );
    expect(
      arrival(
        { ...base, expectedDelivery: new Date(2026, 10, 20).toISOString() },
        now,
      ),
    ).toEqual({ text: 'Arrives tomorrow', tone: 'soon' });
    expect(
      arrival(
        { ...base, expectedDelivery: new Date(2026, 10, 26).toISOString() },
        now,
      ).tone,
    ).toBe('later');
  });
});

describe('matchesQuery', () => {
  const order = {
    title: 'Kindle Paperwhite',
    titles: ['Kindle Paperwhite'],
    vendor: 'amazon',
    orderId: '403-9988776-5544332',
    trackingNumber: null,
    categoryLabel: 'Gadgets',
  } as unknown as Order;
  it('finds by product, shop or order number', () => {
    expect(matchesQuery(order, 'kindle')).toBe(true);
    expect(matchesQuery(order, 'AMAZON')).toBe(true);
    expect(matchesQuery(order, '9988776')).toBe(true);
    expect(matchesQuery(order, 'myntra')).toBe(false);
  });
});

describe('matchesDate', () => {
  const order = {
    orderedAt: new Date(2026, 10, 19, 10).toISOString(),
  } as Order;
  it('filters by month or day', () => {
    expect(matchesDate(order, { kind: 'month', year: 2026, month: 10 })).toBe(
      true,
    );
    expect(
      matchesDate(order, { kind: 'day', year: 2026, month: 10, day: 19 }),
    ).toBe(true);
    expect(
      matchesDate(order, { kind: 'day', year: 2026, month: 10, day: 18 }),
    ).toBe(false);
    expect(matchesDate(order, null)).toBe(true);
  });
});
