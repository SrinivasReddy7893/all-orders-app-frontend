import React from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { DialogProvider } from '@/components/common/Dialog';
import { ToastProvider } from '@/components/common/Toast';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SessionProvider } from '@/store/session';

function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SessionProvider>
        <ToastProvider>
          <DialogProvider>
            <RootNavigator />
          </DialogProvider>
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

export default App;
