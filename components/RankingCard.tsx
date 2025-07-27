import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CoupleStat {
  name: string;
  points: number;
  avatar: 'person' | 'person-outline' | 'trophy';
  tasksCompleted: number;
}

interface RankingCardProps {
  coupleStats: { [key: string]: CoupleStat };
  theme: {
    text: string;
    background: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
    bgConainer: string
  };
  isDark: boolean;
}

export default function RankingCard({ coupleStats, theme, isDark }: RankingCardProps) {
  const sortedStats = Object.values(coupleStats).sort((a, b) => b.points - a.points);

  return (
    <View style={[styles.rankingCard, { backgroundColor: isDark ? '#151515' : '#fffffff8'  }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'hsl(0, 0%, 20.392156862745097%)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <Ionicons name="trophy" color={theme.tint} size={16} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ranking</Text>
        </View>
      </View>
      <View style={styles.rankingList}>
        {sortedStats.map((stat, index) => (
          <View key={stat.name} style={styles.rankingItem}>
            <Text style={[styles.rankingPosition, { color: theme.tint }]}>{index + 1}º</Text>
            <Ionicons
              name={stat.avatar}
              size={24}
              color={index % 2 === 0 ? theme.tint : theme.tabIconSelected}
            />
            <View style={styles.rankingDetails}>
              <Text style={[styles.rankingName, { color: theme.text }]}>{stat.name}</Text>
              <Text style={[styles.rankingPoints, { color: theme.tabIconDefault }]}>
                {stat.points} pontos, {stat.tasksCompleted} tarefas concluídas
              </Text>
            </View>
          </View>
        ))}
        {sortedStats.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.tabIconDefault }]}>
            Nenhuma tarefa atribuída ainda.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rankingCard: {
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
  rankingList: {
    flexDirection: 'column',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  rankingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  rankingPoints: {
    fontSize: 12,
    fontWeight: '400',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});