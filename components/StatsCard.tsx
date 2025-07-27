import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
  completedTasks: number;
  totalTasks: number;
  theme: {
    text: string;
    background: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
  };
  isDark: boolean;
}

export default function StatsCard({ completedTasks, totalTasks, theme, isDark }: StatsCardProps) {
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <View style={[styles.statsCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#3E8E7E20' }]}>
            <FontAwesome5 name="chart-bar" color="#3E8E7E" size={16} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Estatísticas</Text>
        </View>
      </View>
      <View style={styles.statsContent}>
        <Text style={[styles.statsText, { color: theme.tabIconDefault }]}>
          Tarefas Concluídas: {completedTasks} de {totalTasks}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#3A3A3A' : '#F0F0F0' }]}>
          <View
            style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: '#3E8E7E' }]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.tabIconDefault }]}>
          Progresso: {Math.round(progressPercentage)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContent: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});