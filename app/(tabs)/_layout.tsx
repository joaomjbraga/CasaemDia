import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import Colors from '../../constants/Colors'; // Importa Colors.ts
import { useTheme } from '../../contexts/ThemeContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
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
        name="ExpenseReportScreen"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => <TabBarIcon name="chart-line" color={color} />,
          tabBarLabel: 'Histórico Mês',
        }}
      />
      <Tabs.Screen
        name="AddTaskScreen"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-status" color={color} />,
          tabBarLabel: 'Tarefas',
        }}
      />
      <Tabs.Screen name="(stack)" options={{ href: null }} />
    </Tabs>
  );
}