import React, { createContext, useCallback, useContext, useState } from 'react';

import type { Order } from '@/services/api/orders';

import { useOrders } from '@/store/orders';

import { OrderSheet } from './components/OrderSheet';

type OpenOrder = (order: Order) => void;

const OrderSheetContext = createContext<OpenOrder>(() => undefined);

/**
 * One order sheet for the whole app. Any order, on any screen, opens the
 * same expanded view by calling `useOpenOrder()(order)`.
 */
export function OrderSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orders } = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);
  // Show the latest copy, so a status change shows up in the open sheet.
  const current = selected
    ? orders.find(o => o.id === selected.id) ?? selected
    : null;
  const open = useCallback((order: Order) => setSelected(order), []);
  return (
    <OrderSheetContext.Provider value={open}>
      {children}
      <OrderSheet order={current} onClose={() => setSelected(null)} />
    </OrderSheetContext.Provider>
  );
}

export const useOpenOrder = () => useContext(OrderSheetContext);
