import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
  completedTasks: number;
  totalTasks: number;
  theme: any;
  isDark: boolean;
}

export default function StatsCard({ completedTasks, totalTasks, theme, isDark }: StatsCardProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
        <View style={[styles.statIcon, { backgroundColor: isDark ? '#F4CE14' : '#3E8E7E' }]}>
          <MaterialCommunityIcons name="check-circle" size={20} color={isDark ? '#1E1E1E' : '#FFFFFF'} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>{completedTasks}</Text>
        <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Concluídas</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
        <View style={[styles.statIcon, { backgroundColor: '#FF8C42' }]}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>{totalTasks - completedTasks}</Text>
        <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Pendentes</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
        <View style={[styles.statIcon, { backgroundColor: '#8E44AD' }]}>
          <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>277</Text>
        <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Pontos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 24,
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});