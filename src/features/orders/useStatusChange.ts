import { CircleCheck, CircleX } from 'lucide-react-native';

import { useDialog } from '@/components/common/Dialog';
import type { ManualStatus, Order } from '@/services/api/orders';
import { useOrders } from '@/store/orders';

import {
  formatMoney,
  isActive,
  orderTitle,
  trackStep,
  vendorName,
} from './format';

/** Timeline stops, in order, and the status each one sets. */
export const STEP_STATUS: ManualStatus[] = [
  'PLACED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];
export const STEP_NAME = ['Placed', 'Packed', 'Shipped', 'Delivered'];

/** One-tap dates the order itself already knows. */
const dateShortcuts = (order: Order) => [
  ...(order.expectedDelivery
    ? [{ label: 'Expected', date: new Date(order.expectedDelivery) }]
    : []),
  ...(order.orderedAt
    ? [{ label: 'Order day', date: new Date(order.orderedAt) }]
    : []),
];

/**
 * Saying where an order really is. Shops often skip emails, so the buyer can
 * move an order forward on its timeline, or mark it delivered or cancelled.
 * Every change asks first, because it can't be undone.
 */
export function useOrderActions() {
  const { changeStatus } = useOrders();
  const dialog = useDialog();

  const apply = async (order: Order, status: ManualStatus, day?: string) => {
    const error = await changeStatus(order.id, status, day);
    if (error) dialog.notice('Something went wrong', error);
  };

  /** Move to a later stop on the timeline (0 placed … 3 delivered). */
  const moveTo = (order: Order, step: number) => {
    if (step <= trackStep(order.status)) return;
    const name = STEP_NAME[step];
    // Delivery has a date of its own, so ask for it instead of using today.
    if (step === 3) {
      dialog.pickDate({
        title: 'When was it delivered?',
        message: 'This can’t be undone.',
        confirmLabel: 'Mark delivered',
        min: order.orderedAt ? new Date(order.orderedAt) : undefined,
        shortcuts: dateShortcuts(order),
        onPick: day => apply(order, 'DELIVERED', day),
      });
      return;
    }
    dialog.confirm({
      title: `Mark as ${name.toLowerCase()}?`,
      message:
        'Use this when you know the order has reached this step. It can’t be undone.',
      icon: CircleCheck,
      cancelLabel: 'Not yet',
      confirmLabel: `Yes, ${name.toLowerCase()}`,
      onConfirm: () => apply(order, STEP_STATUS[step]),
    });
  };

  const cancel = (order: Order) =>
    dialog.pickDate({
      title: 'When was it cancelled?',
      message: 'It won’t count in your spend. This can’t be undone.',
      confirmLabel: 'Mark cancelled',
      tone: 'danger',
      min: order.orderedAt ? new Date(order.orderedAt) : undefined,
      shortcuts: dateShortcuts(order).filter(x => x.label === 'Order day'),
      onPick: day => apply(order, 'CANCELLED', day),
    });

  /** The quick actions for an order still on its way. */
  const openMenu = (order: Order) => {
    if (!isActive(order)) return;
    const money = formatMoney(order.amount, order.currency);
    dialog.show({
      layout: 'sheet',
      title: orderTitle(order),
      message: [vendorName(order.vendor), money].filter(Boolean).join(' · '),
      actions: [
        {
          label: 'Mark as delivered',
          icon: CircleCheck,
          tone: 'default',
          onPress: () => moveTo(order, 3),
        },
        {
          label: 'Mark as cancelled',
          icon: CircleX,
          tone: 'danger',
          onPress: () => cancel(order),
        },
        { label: 'Close' },
      ],
    });
  };

  return { moveTo, cancel, openMenu };
}
