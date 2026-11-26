import {
  ArrowUpRight,
  Ellipsis,
  FileText,
  LogOut,
  Mail,
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
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDialog } from '@/components/common/Dialog';
import { EmberScreen } from '@/components/common/EmberScreen';
import { Logo } from '@/components/common/Logo';
import { config } from '@/config/env';
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
  const {
    me,
    orders,
    refreshing,
    refresh,
    connectMailbox,
    disconnectMailbox,
    removeAccount,
  } = useOrders();
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

  // Deleting can't be undone, so it asks twice.
  const confirmDelete = () =>
    dialog.confirm({
      title: 'Delete your account?',
      message:
        'This removes your orders, connected mailboxes and phone sign-in. Your emails stay in Gmail.',
      icon: Trash2,
      tone: 'danger',
      cancelLabel: 'Keep account',
      confirmLabel: 'Continue',
      onConfirm: () =>
        dialog.confirm({
          title: 'Delete everything?',
          message: 'This is permanent. It can’t be undone.',
          icon: Trash2,
          tone: 'danger',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete account',
          onConfirm: async () => fail(await removeAccount()),
        }),
    });

  const open = (url: string) =>
    Linking.openURL(url).catch(() => fail('Couldn’t open the page.'));

  const confirmSignOut = () =>
    dialog.confirm({
      title: 'Sign out of All Orders?',
      message:
        'Your orders stay safe. Sign in with your number to see them again.',
      icon: LogOut,
      cancelLabel: 'Cancel',
      confirmLabel: 'Sign out',
      onConfirm: signOut,
    });

  const addMailbox = async () => fail(await connectMailbox());

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
              {plural(orders.length, 'order')} from{' '}
              {plural(mailboxes.length, 'mailbox', 'mailboxes')}
            </Text>
          </View>
        </View>
      }
    >
      {/* The one thing this screen manages: where orders come from. */}
      <View style={sectionStyles.section}>
        <SectionTitle title="Mailboxes" />
        <View style={styles.group}>
          {mailboxes.map(box => (
            <MailboxRow
              key={box.id}
              box={box}
              onOpen={() => openMailbox(box)}
              onReconnect={addMailbox}
            />
          ))}
          {mailboxes.length < max ? (
            <Pressable
              onPress={addMailbox}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.addIcon}>
                <Plus size={18} color={colors.emberText} strokeWidth={2.4} />
              </View>
              <Text style={styles.addText}>Add a mailbox</Text>
              <Text style={styles.meta}>
                {mailboxes.length} of {max}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.limit}>
              <Text style={styles.meta}>
                {max} of {max} connected. Remove one to add another.
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={refresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityState={{ busy: refreshing }}
          style={({ pressed }) => [styles.sync, pressed && styles.syncPressed]}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.onInk} />
          ) : (
            <RefreshCw size={18} color={colors.onInk} strokeWidth={2.2} />
          )}
          <Text style={styles.syncText}>
            {refreshing ? 'Checking your mail…' : 'Check for new orders'}
          </Text>
        </Pressable>
        <View style={styles.assurance}>
          <ShieldCheck size={14} color={colors.success} strokeWidth={2.2} />
          <Text style={styles.meta}>
            Read-only. We never send, delete or change email.
          </Text>
        </View>
      </View>

      <View style={sectionStyles.section}>
        <SectionTitle title="About" />
        <View style={styles.group}>
          <Line
            icon={ShieldCheck}
            label="Privacy Policy"
            external
            onPress={() => open(config.legalUrls.privacy)}
          />
          <Line
            icon={FileText}
            label="Terms of Use"
            external
            onPress={() => open(config.legalUrls.terms)}
          />
          <Line icon={LogOut} label="Sign out" onPress={confirmSignOut} last />
        </View>
      </View>

      {/* Permanent, so it sits apart and stays quiet until asked for. */}
      <View style={styles.end}>
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
        <Text style={styles.meta}>All Orders · version 0.0.1</Text>
      </View>
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

/** A plain row: icon, words, and an arrow when it leaves the app. */
function Line({
  icon: Icon,
  label,
  onPress,
  external,
  last,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  external?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityHint={external ? 'Opens in your browser' : undefined}
      style={({ pressed }) => [
        styles.line,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
      <Text style={styles.lineText}>{label}</Text>
      {external ? (
        <ArrowUpRight size={18} color={colors.textSecondary} strokeWidth={2} />
      ) : null}
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
  value: { ...typography.label, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  // Dashed, so "add" reads as an empty slot rather than another mailbox.
  addIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...typography.label, flex: 1, color: colors.emberText },
  sync: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  syncPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  syncText: { ...typography.label, color: colors.onInk },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
  },
  lineText: { ...typography.label, flex: 1, color: colors.textPrimary },
  end: { alignItems: 'center', gap: spacing.xxs },
  delete: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  deleteText: { ...typography.label, color: colors.dangerText },
});
