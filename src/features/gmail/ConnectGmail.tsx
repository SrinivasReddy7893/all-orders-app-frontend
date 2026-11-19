import { Check, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { formText } from '@/components/common/FormHeader';
import { Logo } from '@/components/common/Logo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { TextLink } from '@/components/common/TextLink';
import { useEntrance } from '@/hooks/useEntrance';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  /** The browser sign-in was opened and we are waiting for the user. */
  waiting: boolean;
  loading: boolean;
  error?: string;
  onConnect: () => void;
  onCheckAgain: () => void;
};

const READS = [
  'Order confirmations',
  'Shipping and tracking updates',
  'Delivery notices',
];

/** Gmail's mark (Simple Icons), in Gmail red. */
function GmailMark({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </Svg>
  );
}

/**
 * The one ask after sign-in. Shows the two ends being joined (Gmail →
 * All Orders), says exactly what is read, and nothing else.
 */
export function ConnectGmail({
  waiting,
  loading,
  error,
  onConnect,
  onCheckAgain,
}: Props) {
  const art = useEntrance(0);
  const copy = useEntrance(100);
  return (
    <ScreenShell
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={waiting ? 'Open Google sign-in again' : 'Connect Gmail'}
            onPress={onConnect}
            loading={loading}
          />
          {waiting ? (
            <TextLink label="I've finished signing in" onPress={onCheckAgain} />
          ) : null}
        </View>
      }
    >
      <View style={styles.center}>
        <Animated.View style={[styles.pair, art.style]}>
          <View style={styles.tile}>
            <GmailMark />
          </View>
          <View style={styles.link}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.linkDot} />
            ))}
          </View>
          <Logo size={64} />
        </Animated.View>

        <Animated.View style={copy.style}>
          <Text style={styles.title} accessibilityRole="header">
            {waiting
              ? 'Finish in your browser'
              : 'Connect Gmail to find\nyour orders'}
          </Text>
          <Text style={[formText.body, styles.body]}>
            {waiting
              ? 'Pick your account and allow access. You will come straight back here.'
              : 'We only read emails from shops and couriers:'}
          </Text>

          {!waiting ? (
            <View style={styles.list}>
              {READS.map(item => (
                <View key={item} style={styles.item}>
                  <View style={styles.check}>
                    <Check size={13} color={colors.onEmber} strokeWidth={3} />
                  </View>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.assurance}>
            <ShieldCheck
              size={16}
              color={colors.onEmberSubtle}
              strokeWidth={2}
            />
            <Text style={styles.assuranceText}>
              Read-only. We never send, delete or change email.
            </Text>
          </View>

          {error ? (
            <Text
              style={formText.error}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 64 * 0.28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { flexDirection: 'row', gap: 6 },
  linkDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.onEmberSubtle,
  },
  title: {
    ...typography.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: colors.onEmber,
  },
  body: { marginTop: spacing.sm },
  list: { marginTop: spacing.md, gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { ...typography.label, fontSize: 16, color: colors.onEmber },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  assuranceText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.onEmberSubtle,
  },
  footer: { gap: spacing.sm },
});
