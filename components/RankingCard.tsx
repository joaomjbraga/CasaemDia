import Colors from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface CoupleStat {
  name: string;
  points: number;
  avatar: 'person' | 'person-outline' | 'trophy';
  tasksCompleted: number;
}

interface RankingCardProps {
  coupleStats: { [key: string]: CoupleStat };
}

export default function RankingCard({ coupleStats }: RankingCardProps) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);
  const scaleAnims = Object.keys(coupleStats).map(() => new Animated.Value(1));
  const progressAnims = Object.keys(coupleStats).map(() => new Animated.Value(0));

  const sortedStats = Object.values(coupleStats).sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...sortedStats.map((stat) => stat.points), 1);

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
          duration: 1200,
          delay: index * 200,
          useNativeDriver: false,
        })
      ),
    ]).start();

    return () => {
      progressAnims.forEach((anim) => anim.stopAnimation());
      scaleAnims.forEach((anim) => anim.stopAnimation());
    };
  }, [coupleStats]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <RankingHeader total={sortedStats.reduce((s, s2) => s + s2.tasksCompleted, 0)} />

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedStats.length === 0 ? (
            <RankingEmptyState />
          ) : (
            sortedStats.slice(0, 5).map((stat, index) => (
              <RankingItem
                key={stat.name}
                stat={stat}
                index={index}
                maxPoints={maxPoints}
                scaleAnim={scaleAnims[index]}
                progressAnim={progressAnims[index]}
              />
            ))
          )}
        </ScrollView>

        {sortedStats.length > 0 && <RankingFooter />}
      </LinearGradient>
    </Animated.View>
  );
}

const getGradient = (position: number): readonly [string, string] => {
  switch (position) {
    case 0:
      return [Colors.light.illustrationYellow, Colors.light.accentYellow];
    case 1:
      return [Colors.light.accentBlue, Colors.light.accentCyan];
    case 2:
      return [Colors.light.illustrationOrange, Colors.light.accentYellow];
    default:
      return [Colors.light.background, Colors.light.backgroundSecondary];
  }
};

const getIcon = (position: number) => {
  switch (position) {
    case 0:
      return 'crown';
    case 1:
      return 'medal';
    case 2:
      return 'trophy-variant';
    default:
      return 'account-circle-outline';
  }
};

const getRankColor = (position: number) => {
  switch (position) {
    case 0:
      return Colors.light.accentYellow;
    case 1:
      return Colors.light.accentBlue;
    case 2:
      return Colors.light.illustrationOrange;
    default:
      return Colors.light.mutedText;
  }
};

function RankingHeader({ total }: { total: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="trophy" size={20} color={Colors.light.iconPrimary} />
      </View>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Ranking Familiar</Text>
        <Text style={styles.subtitle}>Liderança atual</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{total}</Text>
        <Text style={styles.badgeLabel}>tarefas</Text>
      </View>
    </View>
  );
}

function RankingItem({
  stat,
  index,
  maxPoints,
  scaleAnim,
  progressAnim,
}: {
  stat: CoupleStat;
  index: number;
  maxPoints: number;
  scaleAnim: Animated.Value;
  progressAnim: Animated.Value;
}) {
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${(stat.points / maxPoints) * 100}%`],
    extrapolate: 'clamp',
  });

  const gradient = getGradient(index);
  const rankColor = getRankColor(index);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.item}>
      <Animated.View
        style={[
          styles.itemContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.itemContent}
        >
          <View style={styles.rankSection}>
            <View style={[styles.rankIcon, { backgroundColor: rankColor }]}>
              <MaterialCommunityIcons name={getIcon(index)} size={14} color={Colors.light.iconLight} />
            </View>
            <Text style={[styles.rankText, { color: rankColor }]}>{index + 1}º</Text>
          </View>

          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Ionicons name={stat.avatar} size={18} color={Colors.light.iconPrimary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{stat.name}</Text>
              <View style={styles.statsRow}>
                <Text style={[styles.userStats, { color: rankColor }]}>{stat.points} pts</Text>
                <Text style={styles.userStats}> • {stat.tasksCompleted} tarefas</Text>
              </View>
            </View>
          </View>

          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { backgroundColor: rankColor, width: progressWidth }]} />
            </View>
            <Text style={styles.progressText}>{Math.round((stat.points / maxPoints) * 100)}%</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RankingEmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="trophy-broken" size={32} color={Colors.light.mutedText} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
      <Text style={styles.emptySubtitle}>Complete tarefas para aparecer no ranking</Text>
    </View>
  );
}

function RankingFooter() {
  return (
    <View style={styles.footer}>
      <MaterialCommunityIcons name="star-circle" size={12} color={Colors.light.mutedText} />
      <Text style={styles.footerText}>Continue completando tarefas para subir no ranking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    flex: 1,
    minHeight: 320,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    minWidth: 48,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.accentBlue,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.light.mutedText,
    marginTop: 1,
  },
  list: {
    flex: 1,
    maxHeight: 220,
  },
  listContent: {
    gap: 6,
    paddingBottom: 6,
  },
  item: {
    borderRadius: 10,
  },
  itemContainer: {
    borderRadius: 10,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 10,
  },
  rankSection: {
    alignItems: 'center',
    marginRight: 6,
    minWidth: 30,
  },
  rankIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userStats: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.light.mutedText,
  },
  progress: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  progressBar: {
    width: 44,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.light.progressBackground,
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.cardBackground,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.light.mutedText,
    textAlign: 'center',
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    marginTop: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.light.mutedText,
    textAlign: 'center',
  },
});