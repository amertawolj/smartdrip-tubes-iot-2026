import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#1B7A4A',
        tabBarInactiveTintColor: 'rgba(27, 122, 74, 0.35)',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Homepage',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="setelan"
        options={{
          title: 'Setelan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
