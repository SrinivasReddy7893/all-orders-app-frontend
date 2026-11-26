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

import { getGmailConnectUrl } from '@/services/api/auth';
import { describeError } from '@/services/api/errors';
import {
  deleteAccount,
  getMe,
  getOrders,
  getSummary,
  removeMailbox,
  setOrderStatus,
  syncOrders,
  type ManualStatus,
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
  /** Opens Google to connect a mailbox. Resolves to an error message, if any. */
  connectMailbox: () => Promise<string | undefined>;
  /** Deletes the account, then signs out. Resolves to an error message, if any. */
  removeAccount: () => Promise<string | undefined>;
  /** Moves an order forward on its timeline. Resolves to an error message, if any. */
  changeStatus: (
    id: string,
    status: ManualStatus,
    date?: string,
  ) => Promise<string | undefined>;
  /** Removes a mailbox and its orders. Resolves to an error message, if any. */
  disconnectMailbox: (id: string) => Promise<string | undefined>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * One source of orders for every tab. Coming back to the app, or back
 * from Google (allorders://), re-checks so nobody refreshes by hand.
 */
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { authorized, signOut } = useSession();
  const [me, setMe] = useState<Me>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<MonthSummary>();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      const user = await authorized(getMe);
      setMe(user);
      if (user.mailboxes.length) {
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

  // Still working on a mailbox's first look, ignoring any that need reconnecting.
  const syncing = !!me?.mailboxes.some(
    m => !m.needsReconnect && (m.isSyncing || !m.lastSyncedAt),
  );
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

  const connectMailbox = useCallback(async () => {
    try {
      await Linking.openURL(await authorized(getGmailConnectUrl));
      return undefined;
    } catch (e) {
      return describeError(e);
    }
  }, [authorized]);

  const changeStatus = useCallback(
    async (id: string, status: ManualStatus, date?: string) => {
      try {
        await authorized(t => setOrderStatus(t, id, status, date));
        await load();
        return undefined;
      } catch (e) {
        return describeError(e);
      }
    },
    [authorized, load],
  );

  const removeAccount = useCallback(async () => {
    try {
      await authorized(deleteAccount);
    } catch (e) {
      return describeError(e);
    }
    await signOut();
    return undefined;
  }, [authorized, signOut]);

  const disconnectMailbox = useCallback(
    async (id: string) => {
      try {
        await authorized(t => removeMailbox(t, id));
        await load();
        return undefined;
      } catch (e) {
        return describeError(e);
      }
    },
    [authorized, load],
  );

  const value = useMemo(
    () => ({
      me,
      orders,
      summary,
      syncing,
      refreshing,
      error,
      load,
      refresh,
      connectMailbox,
      disconnectMailbox,
      changeStatus,
      removeAccount,
    }),
    [
      me,
      orders,
      summary,
      syncing,
      refreshing,
      error,
      load,
      refresh,
      connectMailbox,
      disconnectMailbox,
      changeStatus,
      removeAccount,
    ],
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
