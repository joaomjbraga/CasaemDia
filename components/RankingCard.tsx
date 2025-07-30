import Colors from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Animated,
  ColorValue,
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
  theme: any;
  isDark: boolean;
}

export default function RankingCard({ coupleStats, isDark }: RankingCardProps) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);
  const scaleAnims = Object.keys(coupleStats).map(() => new Animated.Value(1));
  const progressAnims = Object.keys(coupleStats).map(() => new Animated.Value(0));

  const cardColors = isDark ? Colors.dark : Colors.light;

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
          backgroundColor: cardColors.cardBackground,
          borderColor: cardColors.cardBackground,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <RankingHeader total={sortedStats.reduce((s, s2) => s + s2.tasksCompleted, 0)} color={cardColors} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedStats.length === 0 ? (
          <RankingEmptyState color={cardColors} />
        ) : (
          sortedStats.slice(0, 5).map((stat, index) => (
            <RankingItem
              key={stat.name}
              stat={stat}
              index={index}
              maxPoints={maxPoints}
              color={cardColors}
              scaleAnim={scaleAnims[index]}
              progressAnim={progressAnims[index]}
              isDark={isDark}
            />
          ))
        )}
      </ScrollView>

      {sortedStats.length > 0 && <RankingFooter color={cardColors} />}
    </Animated.View>
  );
}

const getGradient = (position: number, isDark: boolean): readonly [ColorValue, ColorValue] => {
  if (isDark) {
    switch (position) {
      case 0:
        return ['#FFD700', '#D4AF37'];
      case 1:
        return ['#C0C0C0', '#A0A0A0'];
      case 2:
        return ['#CD7F32', '#B87333'];
      default:
        return ['#161616', '#0A0A0A'];
    }
  } else {
    switch (position) {
      case 0:
        return ['#B8860B', '#FFD700'];
      case 1:
        return ['#708090', '#C0C0C0'];
      case 2:
        return ['#A0522D', '#CD7F32'];
      default:
        return ['#3b3240', '#2a252d'];
    }
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

const getRankColor = (position: number, isDark: boolean) => {
  if (isDark) {
    switch (position) {
      case 0:
        return '#D4AF37';
      case 1:
        return '#C0C0C0';
      case 2:
        return '#CD7F32';
      default:
        return '#71717A';
    }
  } else {
    switch (position) {
      case 0:
        return '#B8860B';
      case 1:
        return '#708090';
      case 2:
        return '#A0522D';
      default:
        return '#52525B';
    }
  }
};

function RankingHeader({ total, color }: { total: number; color: any }) {
  return (
    <View style={styles.header}>
      <View style={[styles.headerIcon, { backgroundColor: color.itemBg, borderColor: color.border }]}>
        <MaterialCommunityIcons name="trophy" size={20} color={color.accent} />
      </View>
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: color.text }]}>Ranking Familiar</Text>
        <Text style={[styles.subtitle, { color: color.subtitle }]}>Liderança atual</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color.itemBg, borderColor: color.border }]}>
        <Text style={[styles.badgeText, { color: color.accent }]}>{total}</Text>
        <Text style={[styles.badgeLabel, { color: color.mutedText }]}>tarefas</Text>
      </View>
    </View>
  );
}

function RankingItem({
  stat,
  index,
  maxPoints,
  color,
  scaleAnim,
  progressAnim,
  isDark,
}: {
  stat: CoupleStat;
  index: number;
  maxPoints: number;
  color: any;
  scaleAnim: Animated.Value;
  progressAnim: Animated.Value;
  isDark: boolean;
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

  const gradient = getGradient(index, isDark);
  const rankColor = getRankColor(index, isDark);

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
          style={[styles.itemContent, { borderColor: color.border }]}
        >
          <View style={styles.rankSection}>
            <View style={[styles.rankIcon, { backgroundColor: rankColor }]}>
              <MaterialCommunityIcons name={getIcon(index)} size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.rankText, { color: rankColor }]}>{index + 1}º</Text>
          </View>

          <View style={styles.userSection}>
            <View style={[styles.avatar, { backgroundColor: color.cardBg, borderColor: color.border }]}>
              <Ionicons name={stat.avatar} size={18} color={color.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: color.text }]}>{stat.name}</Text>
              <View style={styles.statsRow}>
                <Text style={[styles.userStats, { color: rankColor }]}>{stat.points} pts</Text>
                <Text style={[styles.userStats, { color: color.mutedText }]}> • {stat.tasksCompleted} tarefas</Text>
              </View>
            </View>
          </View>

          <View style={styles.progress}>
            <View style={[styles.progressBar, { backgroundColor: color.border }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: rankColor, width: progressWidth }]} />
            </View>
            <Text style={[styles.progressText, { color: color.mutedText }]}> {Math.round((stat.points / maxPoints) * 100)}%</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RankingEmptyState({ color }: { color: any }) {
  return (
    <View style={[styles.empty, { backgroundColor: color.itemBg, borderColor: color.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: color.cardBg }]}>
        <MaterialCommunityIcons name="trophy-broken" size={32} color={color.mutedText} />
      </View>
      <Text style={[styles.emptyTitle, { color: color.text }]}>Nenhum registro ainda</Text>
      <Text style={[styles.emptySubtitle, { color: color.subtitle }]}>Complete tarefas para aparecer no ranking</Text>
    </View>
  );
}

function RankingFooter({ color }: { color: any }) {
  return (
    <View style={[styles.footer, { borderTopColor: color.border }]}>
      <MaterialCommunityIcons name="star-circle" size={12} color={color.mutedText} />
      <Text style={[styles.footerText, { color: color.mutedText }]}>Continue completando tarefas para subir no ranking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    height: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  list: {
    flex: 1,
    maxHeight: 240,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  item: {
    borderRadius: 12,
  },
  itemContainer: {
    borderRadius: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  rankSection: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 32,
  },
  rankIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  userStats: {
    fontSize: 10,
    fontWeight: '500',
  },
  progress: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  progressBar: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 12,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});