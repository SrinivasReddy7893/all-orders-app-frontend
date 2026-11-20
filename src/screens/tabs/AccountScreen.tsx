import {
  ChevronRight,
  Ellipsis,
  LogOut,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDialog } from '@/components/common/Dialog';
import { EmberScreen } from '@/components/common/EmberScreen';
import { Logo } from '@/components/common/Logo';
import {
  SectionTitle,
  sectionStyles,
} from '@/features/orders/components/OrderSections';
import { plural, timeAgo } from '@/features/orders/format';
import type { Mailbox } from '@/services/api/orders';
import { useOrders } from '@/store/orders';
import { useSession } from '@/store/session';
import { colors, font, gradients, radius, spacing, typography } from '@/theme';
import { formatPhone } from '@/utils/phone';

/** Who you are and which inbox we read, then the few things you can do. */
export function AccountScreen() {
  const { user, signOut } = useSession();
  const { me, orders, refreshing, refresh, connectMailbox, disconnectMailbox } =
    useOrders();
  const mailboxes = me?.mailboxes ?? [];
  const max = me?.maxMailboxes ?? 3;

  const dialog = useDialog();

  const fail = (message?: string) => {
    if (message) dialog.notice('Something went wrong', message);
  };

  const confirmRemove = (box: Mailbox) =>
    dialog.confirm({
      title: `Remove ${box.email}?`,
      message:
        "Orders found only in this mailbox are removed from the app. Your Gmail isn't changed.",
      icon: Trash2,
      tone: 'danger',
      cancelLabel: 'Cancel',
      confirmLabel: 'Remove',
      onConfirm: async () => fail(await disconnectMailbox(box.id)),
    });

  const openMailbox = (box: Mailbox) =>
    dialog.show({
      layout: 'sheet',
      title: box.email,
      message: box.needsReconnect
        ? 'Access ended. Reconnect to keep syncing.'
        : plural(box.orderCount, 'order'),
      actions: [
        ...(box.needsReconnect
          ? [
              {
                label: 'Reconnect',
                icon: RefreshCw,
                tone: 'default' as const,
                onPress: async () => fail(await connectMailbox()),
              },
            ]
          : []),
        {
          label: 'Remove mailbox',
          icon: Trash2,
          tone: 'danger' as const,
          onPress: () => confirmRemove(box),
        },
        { label: 'Close' },
      ],
    });

  const confirmSignOut = () =>
    dialog.confirm({
      title: 'Sign out of All Orders?',
      message:
        'Your orders stay safe. Sign in with your number to see them again.',
      icon: LogOut,
      tone: 'danger',
      cancelLabel: 'Cancel',
      confirmLabel: 'Sign out',
      onConfirm: signOut,
    });

  return (
    <EmberScreen
      title="Account"
      hero={
        <View style={styles.hero}>
          <Logo size={56} shape="circle" />
          <View style={styles.heroText}>
            <Text style={styles.phone}>
              {user ? formatPhone(user.phone) : '—'}
            </Text>
            <Text style={styles.heroMeta}>
              {plural(orders.length, 'order')} tracked
            </Text>
          </View>
        </View>
      }
    >
      <View style={sectionStyles.section}>
        <SectionTitle title="Mailboxes" count={mailboxes.length} />
        <View style={styles.group}>
          {mailboxes.map(box => (
            <MailboxRow
              key={box.id}
              box={box}
              onOpen={() => openMailbox(box)}
              onReconnect={async () => fail(await connectMailbox())}
            />
          ))}
          {mailboxes.length < max ? (
            <Action
              icon={Plus}
              label="Add another mailbox"
              meta={`${mailboxes.length} of ${max} connected`}
              onPress={async () => fail(await connectMailbox())}
              last
            />
          ) : (
            <View style={styles.limit}>
              <Text style={styles.meta}>
                {max} of {max} connected. Remove one to add another.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.assurance}>
          <ShieldCheck size={14} color={colors.success} strokeWidth={2.2} />
          <Text style={styles.assuranceText}>
            Read-only. We never send, delete or change email.
          </Text>
        </View>
      </View>

      <View style={sectionStyles.section}>
        <SectionTitle title="Phone" />
        <View style={styles.group}>
          <Row
            icon={Phone}
            label="Signed in with"
            value={user ? formatPhone(user.phone) : '—'}
            last
          />
        </View>
      </View>

      <View style={sectionStyles.section}>
        <SectionTitle title="Settings" />
        <View style={styles.group}>
          <Action
            icon={RefreshCw}
            label={
              refreshing ? 'Checking for new orders…' : 'Check for new orders'
            }
            busy={refreshing}
            onPress={refresh}
          />
          <Action
            icon={LogOut}
            label="Sign out"
            onPress={confirmSignOut}
            danger
            last
          />
        </View>
      </View>

      <Text style={styles.footer}>All Orders · version 0.0.1</Text>
    </EmberScreen>
  );
}

/**
 * One connected mailbox. A whole-row tap opens its menu; one that lost access
 * says so in words and offers Reconnect right on the row.
 */
function MailboxRow({
  box,
  onOpen,
  onReconnect,
}: {
  box: Mailbox;
  onOpen: () => void;
  onReconnect: () => void;
}) {
  const stale = box.needsReconnect;
  const meta = stale
    ? 'Access ended. Reconnect to keep syncing.'
    : [
        plural(box.orderCount, 'order'),
        box.isSyncing
          ? 'checking now…'
          : box.lastSyncedAt
          ? `checked ${timeAgo(box.lastSyncedAt)}`
          : 'not checked yet',
      ].join(' · ');
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${box.email}, ${meta}`}
      accessibilityHint="Opens options for this mailbox"
      style={({ pressed }) => [
        styles.row,
        styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, stale && styles.iconWarn]}>
        {stale ? (
          <TriangleAlert size={18} color={colors.amberText} strokeWidth={2.2} />
        ) : (
          <Mail size={18} color={colors.emberText} strokeWidth={2} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
          {box.email}
        </Text>
        <Text style={[styles.meta, stale && styles.metaWarn]} numberOfLines={2}>
          {meta}
        </Text>
      </View>
      {stale ? (
        <Pressable
          onPress={onReconnect}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Reconnect ${box.email}`}
          style={({ pressed }) => [styles.reconnect, pressed && styles.pressed]}
        >
          <Text style={styles.reconnectText}>Reconnect</Text>
        </Pressable>
      ) : (
        <Ellipsis size={20} color={colors.textSecondary} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  meta,
  last,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  meta?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.icon}>
        <Icon size={18} color={colors.emberText} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
          {value}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

function Action({
  icon: Icon,
  label,
  meta,
  onPress,
  busy,
  danger,
  last,
}: {
  icon: LucideIcon;
  label: string;
  meta?: string;
  onPress: () => void;
  busy?: boolean;
  danger?: boolean;
  last?: boolean;
}) {
  const tint = danger ? colors.emberText : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, danger && styles.iconDanger]}>
        {busy ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Icon size={18} color={colors.emberText} strokeWidth={2} />
        )}
      </View>
      {meta ? (
        <View style={styles.body}>
          <Text style={[styles.value, { color: tint }]}>{label}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
      ) : (
        <Text style={[styles.value, styles.action, { color: tint }]}>
          {label}
        </Text>
      )}
      {!danger ? <ChevronRight size={18} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  phone: {
    ...font('bold'),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: colors.onEmber,
    fontVariant: ['tabular-nums'],
  },
  heroMeta: { ...typography.body, color: colors.onEmberSubtle },
  group: {
    backgroundColor: colors.surface,
    backgroundImage: gradients.orderCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 8px 20px rgba(226, 80, 26, 0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  pressed: { opacity: 0.6 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.emberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: colors.dangerTint },
  iconWarn: { backgroundColor: colors.amberTint },
  metaWarn: { color: colors.amberText },
  reconnect: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.amberTint,
  },
  reconnectText: { ...font('bold'), fontSize: 13, color: colors.amberText },
  limit: { paddingVertical: spacing.sm + 2 },
  body: { flex: 1, gap: 1 },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.label, color: colors.textPrimary },
  action: { flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xxs,
  },
  assuranceText: { ...typography.caption, color: colors.textSecondary },
  footer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
