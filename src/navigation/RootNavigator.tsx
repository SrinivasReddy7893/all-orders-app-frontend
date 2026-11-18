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

/** Signed-out users start at Welcome; signed-in users skip it entirely. */
export function RootNavigator() {
  const { session } = useSession();
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={session ? 'Home' : 'Welcome'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A0602' },
          animation: reduceMotion ? 'fade' : 'default',
        }}
      >
        <Stack.Screen name="Welcome">
          {({ navigation }) => (
            <WelcomeScreen onGetStarted={() => navigation.navigate('SignIn')} />
          )}
        </Stack.Screen>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
