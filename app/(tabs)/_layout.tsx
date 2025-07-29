import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Theme {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { isDark } = useTheme();

  const theme: Theme = {
    text: isDark ? '#FFFFFF' : '#010101',
    background: isDark ? '#1E1E1E' : '#F5F5F5',
    tint: isDark ? '#C9F31D' : '#3E8E7E',
    tabIconDefault: isDark ? '#A0A0A0' : '#6B6B6B',
    tabIconSelected: isDark ? '#9AB821' : '#2D6B5F',
  };

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          tabBarLabel: 'Início',
        }}
      />
      <Tabs.Screen
        name="shoppinglist"
        options={{
          title: 'Lista de Compras',
          tabBarIcon: ({ color }) => <TabBarIcon name="cart-plus" color={color} />,
          tabBarLabel: 'Lista de Compras',
        }}
      />
      <Tabs.Screen
        name='ExpenseReportScreen'
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => <TabBarIcon name="chart-line" color={color} />,
          tabBarLabel: 'Historico mês',
        }}
      />
      <Tabs.Screen name='(stack)' options={{href: null}} />
    </Tabs>
  );
}