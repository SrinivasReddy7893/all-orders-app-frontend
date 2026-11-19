import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { HomeScreen } from '@/screens/HomeScreen';
import { SignInScreen } from '@/screens/SignInScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { useSession } from '@/store/session';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Signed-out users see Welcome and sign-in; signed-in users only Home.
 * Signing in or out swaps the stack, so no screen resets it by hand.
 */
export function RootNavigator() {
  const { status } = useSession();
  // Platform-default transitions; a crossfade when reduce motion is on.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);
  // Keep the launch background up while the stored session is restored.
  if (status === 'restoring') return null;
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A0602' },
          animation: reduceMotion ? 'fade' : 'default',
        }}
      >
        {status === 'signedIn' ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Welcome">
              {({ navigation }) => (
                <WelcomeScreen
                  onGetStarted={() => navigation.navigate('SignIn')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SignIn" component={SignInScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
