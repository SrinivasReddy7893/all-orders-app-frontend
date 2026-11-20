import type { Order } from '@/services/api/orders';

import {
  arrival,
  matchesDate,
  matchesQuery,
  formatDay,
  arrivalGroup,
  dayGroup,
  formatMoney,
  orderHeadline,
  shareText,
  trackStep,
  vendorName,
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

describe('vendorName', () => {
  test('uses the brand spelling where there is one', () => {
    expect(vendorName('bigbasket')).toBe('BigBasket');
    expect(vendorName('BIGBASKET')).toBe('BigBasket');
  });

  test('capitalises everything else', () => {
    expect(vendorName('amazon')).toBe('Amazon');
    expect(vendorName('APPLE')).toBe('Apple');
    expect(vendorName('big-basket-fresh')).toBe('Big Basket Fresh');
  });
});

describe('dayGroup', () => {
  const now = new Date(2026, 10, 19, 12);

  test('names the nearest days and dates the rest', () => {
    expect(dayGroup(new Date(2026, 10, 19, 9).toISOString(), now).label).toBe(
      'Today',
    );
    expect(dayGroup(new Date(2026, 10, 18, 9).toISOString(), now).label).toBe(
      'Yesterday',
    );
    expect(dayGroup(new Date(2026, 10, 16, 9).toISOString(), now).label).toBe(
      'Mon, 16 Nov',
    );
  });

  test('adds the year only for other years, and keys by day', () => {
    const old = new Date(2025, 11, 2, 9).toISOString();
    expect(dayGroup(old, now).label).toBe('Tue, 2 Dec 2025');
    expect(dayGroup(old, now).key).toBe('2025-12-02');
    expect(dayGroup(null, now).label).toBe('Date unknown');
  });
});

describe('arrivalGroup', () => {
  const now = new Date(2026, 10, 19, 12);
  const order = (over: Partial<Order>) =>
    ({
      status: 'SHIPPED',
      expectedDelivery: null,
      ...over,
    } as Order);

  test('puts today first, then tomorrow, then later dates, then unknown', () => {
    const groups = [
      arrivalGroup(
        order({ expectedDelivery: new Date(2026, 10, 24).toISOString() }),
        now,
      ),
      arrivalGroup(order({}), now),
      arrivalGroup(
        order({ expectedDelivery: new Date(2026, 10, 20).toISOString() }),
        now,
      ),
      arrivalGroup(order({ status: 'OUT_FOR_DELIVERY' }), now),
    ].sort((a, b) => a.key.localeCompare(b.key));
    expect(groups.map(g => g.label)).toEqual([
      'Arriving today',
      'Arriving tomorrow',
      'Arriving Tue, 24 Nov',
      'Arrival date pending',
    ]);
  });
});

describe('shareText', () => {
  const now = new Date(2026, 10, 19, 15);
  const base = {
    title: 'Sony WH-1000XM5 headphones',
    titles: ['Sony WH-1000XM5 headphones'],
    vendor: 'amazon',
    status: 'OUT_FOR_DELIVERY',
    isDelivered: false,
    isCancelled: false,
    amount: 26990,
    orderId: '404-1234567-1234567',
    carrier: { code: 'delhivery', name: 'Delhivery' },
    trackingUrl: 'https://track.example/abc',
    trackingNumber: 'AWB123',
  } as Order;

  it('says what, when and how to follow it, without price or order ID', () => {
    const text = shareText(base, now);
    expect(text).toBe(
      'Sony WH-1000XM5 headphones (Amazon)\nArriving today via Delhivery\nTrack: https://track.example/abc',
    );
    expect(text).not.toMatch(/26|404-/);
  });

  it('counts extra items and falls back to the tracking number', () => {
    const text = shareText(
      {
        ...base,
        titles: ['a', 'b', 'c'],
        trackingUrl: null,
        status: 'SHIPPED',
        expectedDelivery: new Date(2026, 10, 20).toISOString(),
      },
      now,
    );
    expect(text).toContain('+ 2 more (Amazon)');
    expect(text).toContain('Arrives tomorrow via Delhivery');
    expect(text).toContain('Tracking no: AWB123');
  });

  it('drops tracking once delivered or cancelled', () => {
    const delivered = shareText(
      {
        ...base,
        status: 'DELIVERED',
        isDelivered: true,
        deliveredAt: new Date(2026, 10, 18).toISOString(),
      },
      now,
    );
    expect(delivered).toBe(
      'Sony WH-1000XM5 headphones (Amazon)\nDelivered yesterday',
    );
    expect(
      shareText({ ...base, status: 'CANCELLED', isCancelled: true }, now),
    ).toBe('Sony WH-1000XM5 headphones (Amazon)\nCancelled');
  });
});
