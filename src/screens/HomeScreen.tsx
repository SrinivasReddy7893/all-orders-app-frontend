import { Inbox, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { FormHeader, formText } from '@/components/common/FormHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { getGmailConnectUrl } from '@/services/api/auth';
import { describeError } from '@/services/api/errors';
import { useSession } from '@/store/session';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * The dashboard's first-use state. Connecting Gmail lives here, not as a
 * gate in sign-in, so the user reaches the app in two steps.
 */
export function HomeScreen() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string>();

  const connect = async () => {
    if (!session) return;
    setLoading(true);
    setError(undefined);
    try {
      await Linking.openURL(await getGmailConnectUrl(session.accessToken));
      setOpened(true);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      footer={
        <PrimaryButton
          label={opened ? 'Open Gmail sign-in again' : 'Connect Gmail'}
          onPress={connect}
          loading={loading}
        />
      }
    >
      <View style={styles.center}>
        <View style={styles.mark}>
          <Inbox size={28} color={colors.ink} strokeWidth={2} />
        </View>
        <FormHeader title="Your orders will appear here">
          <Text style={formText.body}>
            {opened
              ? 'Finish in your browser. Orders show up here after the first sync.'
              : 'Connect Gmail and we build the list from the order and shipping emails stores already send you.'}
          </Text>
        </FormHeader>
        <View style={styles.assurance}>
          <ShieldCheck size={16} color={colors.onEmberMuted} strokeWidth={2} />
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
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -spacing.md,
  },
  assuranceText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.onEmberMuted,
  },
});
