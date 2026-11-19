import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import React from 'react';

import { OrdersHome } from '@/features/orders/components/OrdersHome';
import { AccountScreen } from '@/screens/tabs/AccountScreen';
import { OrdersScreen } from '@/screens/tabs/OrdersScreen';
import { SpendsScreen } from '@/screens/tabs/SpendsScreen';

import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

export function MainTabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="HomeTab"
        component={OrdersHome}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="SpendsTab"
        component={SpendsScreen}
        options={{ title: 'Spends' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
}
