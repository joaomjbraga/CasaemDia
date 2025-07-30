import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

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
    bgConainer: string;
  };
  isDark: boolean;
}

export default function RankingCard({ coupleStats, theme, isDark }: RankingCardProps) {
  // Animações
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const progressAnims = Object.keys(coupleStats).map(() => new Animated.Value(0));

  // Cores neutras e familiares
  const cardColors = isDark
    ? {
        cardBg: '#1F2937',
        itemBg: 'rgba(249, 250, 251, 0.06)',
        text: '#F9FAFB',
        subtitle: '#9CA3AF',
        border: 'rgba(249, 250, 251, 0.1)',
        accent: '#6B7280'
      }
    : {
        cardBg: '#FFFFFF',
        itemBg: 'rgba(139, 115, 85, 0.06)',
        text: '#111827',
        subtitle: '#6B7280',
        border: 'rgba(139, 115, 85, 0.1)',
        accent: '#8B7355'
      };

  // Sort stats by points
  const sortedStats = Object.values(coupleStats)
    .sort((a, b) => b.points - a.points);

  // Animação de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      ...progressAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          delay: index * 200,
          useNativeDriver: false,
        })
      ),
    ]).start();
  }, [coupleStats]);

  // Cores das posições
  const getPositionColor = (position: number) => {
    switch (position) {
      case 0: return '#FFD700'; // Ouro
      case 1: return '#C0C0C0'; // Prata
      case 2: return '#CD7F32'; // Bronze
      default: return cardColors.accent;
    }
  };

  // Ícone da posição
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0: return 'trophy';
      case 1: return 'medal';
      case 2: return 'medal-outline';
      default: return 'star-outline';
    }
  };

  // Calcular progresso relativo
  const maxPoints = Math.max(...sortedStats.map(stat => stat.points), 1);

  return (
    <Animated.View
      style={[
        styles.rankingCard,
        {
          backgroundColor: cardColors.cardBg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Header melhorado */}
      <View style={styles.modernHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.trophyContainer, { backgroundColor: cardColors.itemBg }]}>
            <MaterialCommunityIcons
              name="trophy-outline"
              color={cardColors.accent}
              size={24}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.sectionTitle, { color: cardColors.text }]}>
              Ranking Familiar
            </Text>
            <Text style={[styles.sectionSubtitle, { color: cardColors.subtitle }]}>
              Conquistas e tarefas concluídas
            </Text>
          </View>
        </View>

        {sortedStats.length > 0 && (
          <View style={[styles.totalStats, { backgroundColor: cardColors.itemBg }]}>
            <Text style={[styles.totalNumber, { color: cardColors.accent }]}>
              {sortedStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)}
            </Text>
            <Text style={[styles.totalLabel, { color: cardColors.subtitle }]}>
              Total
            </Text>
          </View>
        )}
      </View>

      {/* Lista de ranking */}
      <View style={styles.rankingList}>
        {sortedStats.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="trophy-broken"
              size={48}
              color={cardColors.subtitle}
              style={{ opacity: 0.5, marginBottom: 16 }}
            />
            <Text style={[styles.emptyTitle, { color: cardColors.text }]}>
              Nenhuma conquista ainda
            </Text>
            <Text style={[styles.emptyText, { color: cardColors.subtitle }]}>
              Complete tarefas para aparecer no ranking!
            </Text>
          </View>
        ) : (
          sortedStats.map((stat, index) => {
            const progressWidth = progressAnims[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', `${(stat.points / maxPoints) * 100}%`],
              extrapolate: 'clamp',
            }) || '0%';

            return (
              <View key={stat.name} style={[styles.rankingItem, { backgroundColor: cardColors.itemBg }]}>
                {/* Posição e ícone */}
                <View style={styles.positionSection}>
                  <View style={[
                    styles.positionBadge,
                    { backgroundColor: getPositionColor(index) + '20' }
                  ]}>
                    <MaterialCommunityIcons
                      name={getPositionIcon(index) as any}
                      size={20}
                      color={getPositionColor(index)}
                    />
                  </View>
                  <Text style={[styles.positionText, { color: getPositionColor(index) }]}>
                    {index + 1}º
                  </Text>
                </View>

                {/* Avatar e informações */}
                <View style={styles.userSection}>
                  <View style={[styles.avatarContainer, { backgroundColor: cardColors.accent + '20' }]}>
                    <Ionicons
                      name={stat.avatar}
                      size={24}
                      color={cardColors.accent}
                    />
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: cardColors.text }]}>
                      {stat.name}
                    </Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="star" size={12} color={cardColors.accent} />
                        <Text style={[styles.statText, { color: cardColors.subtitle }]}>
                          {stat.points} pts
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="check-circle" size={12} color="#22c55e" />
                        <Text style={[styles.statText, { color: cardColors.subtitle }]}>
                          {stat.tasksCompleted} tarefas
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Barra de progresso */}
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: cardColors.border }]}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: getPositionColor(index),
                          width: progressWidth,
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Rodapé motivacional */}
      {sortedStats.length > 0 && (
        <View style={[styles.motivationalFooter, { borderTopColor: cardColors.border }]}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={16}
            color={cardColors.accent}
          />
          <Text style={[styles.motivationalText, { color: cardColors.subtitle }]}>
            {sortedStats.length === 1
              ? "Continue assim! Mais tarefas = mais pontos"
              : "Parabéns a todos pelos resultados!"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rankingCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
  },
  totalStats: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  totalNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  rankingList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  rankingItem: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  positionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  motivationalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  motivationalText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
});