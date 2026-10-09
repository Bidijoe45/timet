import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { seedDemoData } from '@/db/seed';
import { useForestStore } from '@/features/forest/forestStore';
import { useTagStore } from '@/features/tags/tagStore';
import { useAppTheme } from '@/theme/useAppTheme';

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Open the database, run migrations, seed default tags, then load tags + game state.
  useEffect(() => {
    useTagStore
      .getState()
      .bootstrap()
      .then(() => seedDemoData())
      .then(() => useForestStore.getState().load())
      .catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 10),
          },
          tabBarLabelStyle: { paddingBottom: 2 },
          sceneStyle: { backgroundColor: colors.bg },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Timer',
            tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{
            title: 'Summary',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="forest"
          options={{
            title: 'Forest',
            tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" color={color} size={size} />,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
