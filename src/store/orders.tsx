import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, Linking } from 'react-native';

import { useAppActive } from '@/hooks/useAppActive';

import { describeError } from '@/services/api/errors';
import {
  getMe,
  getOrders,
  getSummary,
  syncOrders,
  type Me,
  type MonthSummary,
  type Order,
} from '@/services/api/orders';
import { useSession } from '@/store/session';

type OrdersContextValue = {
  me?: Me;
  orders: Order[];
  summary?: MonthSummary;
  /** First sync still running: lists may be empty for a reason. */
  syncing: boolean;
  refreshing: boolean;
  error?: string;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * One source of orders for every tab. Coming back to the app, or back
 * from Google (allorders://), re-checks so nobody refreshes by hand.
 */
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { authorized } = useSession();
  const [me, setMe] = useState<Me>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<MonthSummary>();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      const user = await authorized(getMe);
      setMe(user);
      if (user.gmail) {
        const [list, month] = await Promise.all([
          authorized(t => getOrders(t, 100)),
          authorized(t => getSummary(t)),
        ]);
        setOrders(list);
        setSummary(month);
      }
      setError(undefined);
    } catch (e) {
      setError(describeError(e));
    }
  }, [authorized]);

  useEffect(() => {
    load();
    const link = Linking.addEventListener('url', () => load());
    const app = AppState.addEventListener('change', s => {
      if (s === 'active') load();
    });
    return () => {
      link.remove();
      app.remove();
    };
  }, [load]);

  const syncing = !!me?.gmail && (me.gmail.isSyncing || !me.gmail.lastSyncedAt);
  const active = useAppActive();
  // Poll only while syncing and on screen; a backgrounded app stays quiet.
  useEffect(() => {
    if (!syncing || !active) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [syncing, active, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await authorized(syncOrders);
    } catch {
      // A failed sync still leaves the last list on screen.
    }
    await load();
    setRefreshing(false);
  }, [authorized, load]);

  const value = useMemo(
    () => ({ me, orders, summary, syncing, refreshing, error, load, refresh }),
    [me, orders, summary, syncing, refreshing, error, load, refresh],
  );
  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider');
  return ctx;
}
