import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RankingCardProps {
  coupleStats: {
    maria: { name: string; points: number; avatar: string; tasksCompleted: number };
    joao: { name: string; points: number; avatar: string; tasksCompleted: number };
  };
  theme: any;
  isDark: boolean;
}

export default function RankingCard({ coupleStats, theme, isDark }: RankingCardProps) {
  return (
    <View style={[styles.rankingCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: isDark ? '#F4CE1440' : '#3E8E7E40' }]}>
            <MaterialCommunityIcons name="trophy" color={theme.tint} size={20} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ranking do Mês</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.tabIconDefault }]}>🔥 7 dias</Text>
      </View>

      <View style={styles.rankingList}>
        <View style={[styles.rankingItem, styles.rankingFirst, { backgroundColor: isDark ? '#F4CE1420' : '#3E8E7E20', borderColor: theme.tint }]}>
          <View style={styles.rankingLeft}>
            <View style={[styles.rankingPosition, { backgroundColor: theme.tint }]}>
              <Text style={[styles.positionText, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>1º</Text>
            </View>
            <Text style={styles.rankingAvatar}>{coupleStats.maria.avatar}</Text>
            <Text style={[styles.rankingName, { color: theme.text }]}>{coupleStats.maria.name}</Text>
          </View>
          <View style={styles.rankingRight}>
            <Text style={[styles.rankingPoints, { color: theme.tint }]}>{coupleStats.maria.points} pts</Text>
          </View>
        </View>

        <View style={styles.rankingItem}>
          <View style={styles.rankingLeft}>
            <View style={[styles.rankingPosition, { backgroundColor: '#8E8E8E' }]}>
              <Text style={[styles.positionText, { color: '#FFFFFF' }]}>2º</Text>
            </View>
            <Text style={styles.rankingAvatar}>{coupleStats.joao.avatar}</Text>
            <Text style={[styles.rankingName, { color: theme.text }]}>{coupleStats.joao.name}</Text>
          </View>
          <View style={styles.rankingRight}>
            <Text style={[styles.rankingPoints, { color: theme.tabIconDefault }]}>{coupleStats.joao.points} pts</Text>
          </View>
        </View>
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
  rankingList: {
    marginTop: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankingFirst: {
    borderWidth: 1,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingPosition: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankingAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: 'bold',
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
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});