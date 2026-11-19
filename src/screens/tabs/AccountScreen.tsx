import {
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmberScreen } from '@/components/common/EmberScreen';
import { Logo } from '@/components/common/Logo';
import {
  SectionTitle,
  sectionStyles,
} from '@/features/orders/components/OrderSections';
import { plural, timeAgo } from '@/features/orders/format';
import { useOrders } from '@/store/orders';
import { useSession } from '@/store/session';
import { colors, font, gradients, radius, spacing, typography } from '@/theme';
import { formatPhone } from '@/utils/phone';

/** Who you are and which inbox we read, then the few things you can do. */
export function AccountScreen() {
  const { user, signOut } = useSession();
  const { me, orders, refreshing, refresh } = useOrders();
  const gmail = me?.gmail;

  const confirmSignOut = () =>
    Alert.alert(
      'Sign out of All Orders?',
      'Your orders stay safe. Sign in with your number to see them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ],
    );

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
        <SectionTitle title="Connected" />
        <View style={styles.group}>
          <Row
            icon={Phone}
            label="Phone"
            value={user ? formatPhone(user.phone) : '—'}
          />
          <Row
            icon={Mail}
            label="Gmail"
            value={gmail?.email ?? 'Not connected'}
            meta={
              gmail?.lastSyncedAt
                ? `Checked ${timeAgo(gmail.lastSyncedAt)}`
                : undefined
            }
            last
          />
        </View>
        <View style={styles.assurance}>
          <ShieldCheck size={14} color={colors.success} strokeWidth={2.2} />
          <Text style={styles.assuranceText}>
            Read-only. We never send, delete or change email.
          </Text>
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
  onPress,
  busy,
  danger,
  last,
}: {
  icon: LucideIcon;
  label: string;
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
      <Text style={[styles.value, styles.action, { color: tint }]}>
        {label}
      </Text>
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
