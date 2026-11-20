import { apiRequest } from './client';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export type Order = {
  id: string;
  title: string | null;
  titles: string[];
  orderId: string | null;
  vendor: string;
  category: string;
  categoryLabel: string;
  status: OrderStatus;
  amount: number | null;
  currency: string | null;
  trackingNumber: string | null;
  carrier: { code: string; name: string } | null;
  trackingUrl: string | null;
  orderedAt: string | null;
  deliveredAt: string | null;
  cancelledAt?: string | null;
  expectedDelivery: string | null;
  /** Mailboxes this order was found in. */
  mailboxes?: string[];
  /** The shop's own logo, taken from its order emails. */
  logoUrl?: string | null;
  /** Latest order email or courier scan; falls back to the order date. */
  lastUpdateAt?: string | null;
  isDelivered: boolean;
  isInTransit: boolean;
  isCancelled: boolean;
};

export type Me = {
  id: string;
  phone: string;
  name: string | null;
  mailboxes: Mailbox[];
  maxMailboxes: number;
};

/** One connected Gmail: who, how fresh, and whether it needs attention. */
export type Mailbox = {
  id: string;
  email: string;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  /** Google took access back; connect it again to keep syncing. */
  needsReconnect: boolean;
  orderCount: number;
};

export type CategorySpend = {
  category: string;
  label: string;
  orderCount: number;
  spent: number;
};

export type MonthSummary = {
  month: string;
  currency: string;
  totalSpent: number;
  orderCount: number;
  unpricedOrders: number;
  categories: CategorySpend[];
};

export const getMe = async (token: string) =>
  (await apiRequest<{ data: { user: Me } }>('/user/me', { token })).data.user;

export const getOrders = async (token: string, pageSize = 50) =>
  (
    await apiRequest<{ data: { orders: Order[] } }>(
      `/orders?pageSize=${pageSize}`,
      { token },
    )
  ).data.orders;

/** month is "YYYY-MM"; the server defaults to the current month. */
export const getSummary = async (token: string, month?: string) =>
  (
    await apiRequest<{ data: MonthSummary }>(
      `/orders/summary${month ? `?month=${month}` : ''}`,
      { token },
    )
  ).data;

export const syncOrders = (token: string) =>
  apiRequest<unknown>('/orders/sync', { method: 'POST', token });

/** Removes a mailbox and the orders that were found only in it. */
export const removeMailbox = async (token: string, id: string) =>
  (
    await apiRequest<{ data: { removedOrders: number } }>(
      `/user/mailboxes/${id}`,
      { method: 'DELETE', token },
    )
  ).data;

/** The steps a buyer can move an order to by hand. */
export type ManualStatus =
  | 'PLACED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

/** The buyer moves an order forward on its timeline (shops often skip emails). */
export const setOrderStatus = (
  token: string,
  id: string,
  status: ManualStatus,
  /** The day it was delivered or cancelled, YYYY-MM-DD. Defaults to today. */
  date?: string,
) =>
  apiRequest<unknown>(`/orders/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status, date }),
  });
