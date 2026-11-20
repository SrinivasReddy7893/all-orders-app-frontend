import type { Order, OrderStatus } from '@/services/api/orders';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Packing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

/** Steps on the four-stop track: Placed, Confirmed, Shipped, Delivered. */
export const TRACK_STEPS = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

export function trackStep(status: OrderStatus): number {
  switch (status) {
    case 'PLACED':
      return 0;
    case 'CONFIRMED':
    case 'PROCESSING':
      return 1;
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return 2;
    default:
      return 3;
  }
}

/** ₹1,23,456 — Indian digit grouping, no paise unless there are any. */
export function formatMoney(amount: number | null, currency?: string | null) {
  if (amount == null) return null;
  const symbol = !currency || currency === 'INR' ? '₹' : `${currency} `;
  const [whole, fraction] = Math.abs(amount).toFixed(2).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? `${rest},${last3}` : last3;
  return `${amount < 0 ? '-' : ''}${symbol}${grouped}${
    fraction === '00' ? '' : `.${fraction}`
  }`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Tomorrow", "Thu, 21 Nov". */
export function formatDay(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Orders grouped by the day they were placed: a stable key and a label. */
export function dayGroup(iso: string | null, now = new Date()) {
  if (!iso) return { key: 'undated', label: 'Date unknown' };
  const d = new Date(iso);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
  const day = formatDay(iso, now);
  const relative = /^(Today|Tomorrow|Yesterday)$/.test(day);
  const label =
    relative || d.getFullYear() === now.getFullYear()
      ? day
      : `${day} ${d.getFullYear()}`;
  return { key, label };
}

/** "Today" → "today", but "Thu, 21 Nov" stays as written. */
const inSentence = (day: string) =>
  /^(Today|Tomorrow|Yesterday)$/.test(day) ? day.toLowerCase() : day;

/** The one line that matters most for an order right now. */
export function orderHeadline(order: Order, now = new Date()) {
  if (order.status === 'OUT_FOR_DELIVERY') return 'Arriving today';
  if (order.isDelivered && order.deliveredAt)
    return `Delivered ${inSentence(formatDay(order.deliveredAt, now))}`;
  if (order.expectedDelivery && !order.isDelivered && !order.isCancelled)
    return `Arrives ${inSentence(formatDay(order.expectedDelivery, now))}`;
  return STATUS_LABEL[order.status];
}

export type ArrivalTone = 'now' | 'soon' | 'later';

/** The arrival line plus how urgent it is, for the card's badge. */
export function arrival(
  order: Order,
  now = new Date(),
): { text: string; tone: ArrivalTone } {
  const late = orderAlert(order, now);
  if (late?.kind === 'overdue') return { text: late.text, tone: 'later' };
  if (order.status === 'OUT_FOR_DELIVERY')
    return { text: 'Arriving today', tone: 'now' };
  if (!order.expectedDelivery)
    return { text: STATUS_LABEL[order.status], tone: 'later' };
  const days = Math.round(
    (startOfDay(new Date(order.expectedDelivery)) - startOfDay(now)) / 86400000,
  );
  return {
    text: orderHeadline(order, now),
    tone: days <= 0 ? 'now' : days === 1 ? 'soon' : 'later',
  };
}

/** "1 order", "3 orders". */
export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export const orderTitle = (order: Order) =>
  order.title ?? order.titles[0] ?? `${vendorName(order.vendor)} order`;

/**
 * A message for family or friends: what is coming, where it stands, and how
 * to follow it. Leaves out price and order ID, which are the buyer's own.
 */
export function shareText(order: Order, now = new Date()) {
  const first = orderTitle(order);
  const more = order.titles.length - 1;
  const what = `${first}${more > 0 ? ` + ${more} more` : ''} (${vendorName(
    order.vendor,
  )})`;

  const active = isActive(order);
  let status: string;
  if (order.isDelivered)
    status = order.deliveredAt
      ? `Delivered ${inSentence(formatDay(order.deliveredAt, now))}`
      : STATUS_LABEL.DELIVERED;
  else if (active) status = orderHeadline(order, now);
  else status = STATUS_LABEL[order.status];
  if (active && order.carrier) status += ` via ${order.carrier.name}`;

  const lines = [what, status];
  if (active) {
    if (order.trackingUrl) lines.push(`Track: ${order.trackingUrl}`);
    else if (order.trackingNumber)
      lines.push(`Tracking no: ${order.trackingNumber}`);
  }
  return lines.join('\n');
}

/** Brands whose own spelling isn't plain capitalisation. */
const BRAND_NAME: Record<string, string> = {
  bigbasket: 'BigBasket',
  jiomart: 'JioMart',
  dmart: 'DMart',
  tatacliq: 'Tata CLiQ',
  firstcry: 'FirstCry',
  ikea: 'IKEA',
  boat: 'boAt',
};

/** "amazon" → "Amazon", "BIGBASKET" → "BigBasket", "big-basket" → "Big Basket". */
export const vendorName = (vendor: string) =>
  BRAND_NAME[vendor.toLowerCase().replace(/[^a-z]/g, '')] ??
  vendor
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const monthName = (month: string) =>
  MONTHS_LONG[Number(month.slice(5, 7)) - 1];

/** Search across what people remember: product, shop, order or AWB number. */
export function matchesQuery(order: Order, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    order.title,
    ...order.titles,
    order.vendor,
    order.orderId,
    order.trackingNumber,
    order.categoryLabel,
  ].some(v => v?.toLowerCase().includes(q));
}

/** Still on its way (not delivered, cancelled, returned or refunded). */
export const isActive = (o: Order) =>
  !o.isDelivered &&
  !o.isCancelled &&
  o.status !== 'RETURNED' &&
  o.status !== 'REFUNDED';

/** Days without news before an order with no expected date counts as stalled. */
export const STALLED_AFTER_DAYS = 4;

export type OrderAlert = { kind: 'overdue' | 'stalled'; text: string };

/**
 * Something worth a second look on an order still on its way. Only facts we
 * hold: the expected date has passed, or nothing has happened for days and
 * there is no date to wait for. Out for delivery counts as today unless its
 * date has long passed.
 */
export function orderAlert(order: Order, now = new Date()): OrderAlert | null {
  if (!isActive(order)) return null;
  const days = (from: string) =>
    Math.round((startOfDay(now) - startOfDay(new Date(from))) / 86400000);

  if (order.expectedDelivery) {
    const late = days(order.expectedDelivery);
    return late > 0
      ? { kind: 'overdue', text: `Overdue by ${plural(late, 'day')}` }
      : null;
  }
  // "Out for delivery" with no date is a today-only status, never "stalled".
  if (order.status === 'OUT_FOR_DELIVERY') return null;
  const quiet = order.lastUpdateAt ? days(order.lastUpdateAt) : 0;
  return quiet >= STALLED_AFTER_DAYS
    ? { kind: 'stalled', text: `No update for ${quiet} days` }
    : null;
}

/** Soonest first: out for delivery, then by expected date. */
export const bySoonest = (a: Order, b: Order) => {
  const eta = (o: Order) =>
    o.status === 'OUT_FOR_DELIVERY'
      ? 0
      : o.expectedDelivery
      ? Date.parse(o.expectedDelivery)
      : Number.MAX_SAFE_INTEGER;
  return eta(a) - eta(b);
};

/**
 * Which "arriving" bucket an order on its way belongs to. Keys sort
 * soonest-first as plain strings: today, tomorrow, later dates, unknown.
 */
export function arrivalGroup(order: Order, now = new Date()) {
  if (orderAlert(order, now)?.kind === 'overdue')
    return { key: '0-overdue', label: 'Overdue' };
  if (order.status === 'OUT_FOR_DELIVERY' || !order.expectedDelivery) {
    return order.status === 'OUT_FOR_DELIVERY'
      ? { key: '0-today', label: 'Arriving today' }
      : { key: '9-unknown', label: 'Arrival date pending' };
  }
  const d = new Date(order.expectedDelivery);
  const days = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
  if (days < 0) return { key: '0-overdue', label: 'Overdue' };
  if (days === 0) return { key: '0-today', label: 'Arriving today' };
  if (days === 1) return { key: '1-tomorrow', label: 'Arriving tomorrow' };
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    key: `2-${stamp}`,
    label: `Arriving ${formatDay(order.expectedDelivery, now)}`,
  };
}

/** "November 2026" — the month an order was placed, for grouping. */
export const monthKey = (iso: string | null) => {
  if (!iso) return 'Undated';
  const d = new Date(iso);
  return `${monthName(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
  )} ${d.getFullYear()}`;
};

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string, now = new Date()) {
  const s = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return plural(Math.floor(s / 86400), 'day') + ' ago';
}

/** A calendar pick: a whole month, or one day in it (month is 0-based). */
export type DateFilter =
  | { kind: 'month'; year: number; month: number }
  | { kind: 'day'; year: number; month: number; day: number };

export function matchesDate(order: Order, f: DateFilter | null) {
  if (!f) return true;
  if (!order.orderedAt) return false;
  const d = new Date(order.orderedAt);
  if (d.getFullYear() !== f.year || d.getMonth() !== f.month) return false;
  return f.kind === 'month' || d.getDate() === f.day;
}

/** "November 2026" or "Thu, 19 Nov". */
export function dateFilterLabel(f: DateFilter) {
  if (f.kind === 'month') return `${MONTHS_LONG[f.month]} ${f.year}`;
  const d = new Date(f.year, f.month, f.day);
  return `${DAYS[d.getDay()]}, ${f.day} ${MONTHS[f.month]}`;
}
