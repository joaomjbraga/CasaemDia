import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Colors from '../../constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  size?: number;
}) {
  return <MaterialCommunityIcons size={props.size || 24} {...props} />;
}

function CentralButton({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.centralButtonContainer}>
      <View style={[styles.centralButton, { backgroundColor: Colors.light.tint }]}>
        <MaterialCommunityIcons
          name="home"
          size={28}
          color="white"
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  // Usando apenas as cores light como solicitado
  const colors = Colors.light;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="shoppinglist"
        options={{
          title: 'Lista de Compras',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabBarIcon name="view-list" color={color} size={24} />
            </View>
          ),
          tabBarLabel: 'Compras',
        }}
      />
      <Tabs.Screen
        name="AddTaskScreen"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabBarIcon name="list-status" color={color} size={24} />
            </View>
          ),
          tabBarLabel: 'Tarefas',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <CentralButton color={color} focused={focused} />,
          tabBarLabel: 'Dashboard',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 8,
            color: colors.tint,
          },
        }}
      />
      <Tabs.Screen
        name="CalenderScreen"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabBarIcon name="calendar" color={color} size={24} />
            </View>
          ),
          tabBarLabel: 'Agenda',
        }}
      />
      <Tabs.Screen
        name="ChatScreen"
        options={{
          title: 'Chat Interno',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <TabBarIcon name="chat" color={color} size={24} />
            </View>
          ),
          tabBarLabel: 'Chat',
        }}
      />
      <Tabs.Screen name="ExpenseReportScreen" options={{ href: null }} />
      <Tabs.Screen name="EventDetailsScreen" options={{ href: null }} />
      <Tabs.Screen name="(stack)" options={{ href: null }} />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  activeIconContainer: {
    backgroundColor: 'transparent',
  },
  centralButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centralButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});