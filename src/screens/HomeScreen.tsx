import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formText } from '@/components/common/FormHeader';
import { TextLink } from '@/components/common/TextLink';
import { ConnectGmail } from '@/features/gmail/ConnectGmail';
import { OrderSheetProvider } from '@/features/orders/OrderSheetContext';
import { MainTabs } from '@/navigation/MainTabs';
import { getGmailConnectUrl } from '@/services/api/auth';
import { describeError } from '@/services/api/errors';
import { OrdersProvider, useOrders } from '@/store/orders';
import { useSession } from '@/store/session';
import { colors, gradients } from '@/theme';

/** Signed in: either the one remaining ask (Gmail) or the app itself. */
export function HomeScreen() {
  return (
    <OrdersProvider>
      <Gate />
    </OrdersProvider>
  );
}

function Gate() {
  const { authorized } = useSession();
  const { me, error, load } = useOrders();
  const [waiting, setWaiting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string>();

  const connect = async () => {
    setConnecting(true);
    setConnectError(undefined);
    try {
      await Linking.openURL(await authorized(getGmailConnectUrl));
      setWaiting(true);
    } catch (e) {
      setConnectError(describeError(e));
    } finally {
      setConnecting(false);
    }
  };

  if (!me) {
    return (
      <View style={styles.loading}>
        {error ? (
          <>
            <Text style={formText.error}>{error}</Text>
            <TextLink label="Try again" onPress={load} />
          </>
        ) : (
          <ActivityIndicator color={colors.onEmber} />
        )}
      </View>
    );
  }

  if (!me.mailboxes.length) {
    return (
      <ConnectGmail
        waiting={waiting}
        loading={connecting}
        error={connectError ?? error}
        onConnect={connect}
        onCheckAgain={load}
      />
    );
  }

  return (
    <OrderSheetProvider>
      <MainTabs />
    </OrderSheetProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.ember,
    gap: 12,
    padding: 24,
  },
});
