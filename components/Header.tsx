import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  user: {
    id?: string;
    user_metadata?: {
      full_name?: string;
    };
    email?: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animações minimalistas - usando useMemo para evitar recriação
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

  const colors = Colors.light;

  // Animação de entrada suave - usando useCallback para evitar recriação
  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  // Atualizar horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          onPress: async () => {
            if (isLoggingOut) return; // Evitar múltiplos cliques

            setIsLoggingOut(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            } finally {
              setIsLoggingOut(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, [signOut, isLoggingOut]);

  const handleOpenSettings = useCallback(() => {
    router.push('/_settings');
  }, [router]);

  const getTimeOfDay = useCallback(() => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Bom dia',
        icon: 'weather-sunny' as const,
        period: 'manhã',
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: 'Boa tarde',
        icon: 'weather-partly-cloudy' as const,
        period: 'tarde',
      };
    } else {
      return {
        greeting: 'Boa noite',
        icon: 'weather-night' as const,
        period: 'noite',
      };
    }
  }, [currentTime]);

  const getFamilyName = useCallback((): string => {
    const userName = user?.user_metadata?.full_name || 'Casa';
    return `${userName}`;
  }, [user?.user_metadata?.full_name]);

  const getCurrentTime = useCallback((): string => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [currentTime]);

  const timeInfo = useMemo(() => getTimeOfDay(), [getTimeOfDay]);

  const slideInterpolate = useMemo(() => slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  }), [slideAnim]);

  // Calcular altura do status bar baseado na plataforma e safe area
  const statusBarHeight = useMemo(() => {
    if (Platform.OS === 'ios') {
      return insets.top || 44;
    }
    return StatusBar.currentHeight || 24;
  }, [insets.top]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideInterpolate }]
          }
        ]}
      >
        <View style={styles.brandSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons
              name="home-variant"
              size={24}
              color="white"
            />
          </View>
          <View style={styles.appTitleContainer}>
            <Text style={[styles.appName, { color: colors.text }]}>
              Casa em Dia
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.mutedText }]}>
              Organização Familiar
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityLabel="Sair da conta"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.mutedText} />
            ) : (
              <MaterialCommunityIcons
                name="logout-variant"
                size={20}
                color={colors.mutedText}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenSettings}
            accessibilityLabel="Configurações"
          >
            <MaterialCommunityIcons
              name="cog"
              size={20}
              color={colors.mutedText}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Greeting Card */}
      <Animated.View
        style={[
          styles.greetingCard,
          {
            backgroundColor: colors.cardBackground,
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.greetingContent}>
          <View style={styles.greetingLeft}>
            <View style={[styles.timeIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name={timeInfo.icon}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.greetingText}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {timeInfo.greeting}, {getFamilyName()}
              </Text>
              <Text style={[styles.period, { color: colors.mutedText }]}>
                {timeInfo.period}
              </Text>
            </View>
          </View>

          <View style={styles.timeDisplay}>
            <Text style={[styles.currentTime, { color: colors.text }]}>
              {getCurrentTime()}
            </Text>
          </View>
        </View>

        {/* Simple Stats */}
        <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.statText, { color: colors.mutedText }]}>Tarefas</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="account-group"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.statText, { color: colors.mutedText }]}>Família</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="home-heart"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.statText, { color: colors.mutedText }]}>Casa</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusBarSpacer: {
    // Altura dinâmica será aplicada via prop
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 24,
    minHeight: 44, // Garante altura mínima para toque
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Permite que o texto seja truncado se necessário
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0, // Não permite que o logo seja comprimido
  },
  appTitleContainer: {
    flex: 1,
    minWidth: 0, // Permite truncar o texto se necessário
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0, // Não permite que os botões sejam comprimidos
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    // Adiciona área de toque maior para melhor UX
    ...(Platform.OS === 'ios' && {
      hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    }),
  },
  greetingCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: Platform.OS === 'ios' ? '#000' : '#A259FF', // Sombra diferente por plataforma
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.15,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 3 : 0, // Elevation apenas no Android
  },
  greetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    minHeight: 48, // Garante altura mínima
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  greetingText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  period: {
    fontSize: 12,
    fontWeight: '400',
  },
  timeDisplay: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  currentTime: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth, // Usa hairline width para bordas mais finas
    minHeight: 40,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 24, // Garante área de toque adequada
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    marginHorizontal: 8,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
  },
});