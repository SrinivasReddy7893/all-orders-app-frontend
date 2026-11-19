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
  expectedDelivery: string | null;
  isDelivered: boolean;
  isInTransit: boolean;
  isCancelled: boolean;
};

export type Me = {
  id: string;
  phone: string;
  name: string | null;
  gmail: {
    email: string;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  } | null;
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
