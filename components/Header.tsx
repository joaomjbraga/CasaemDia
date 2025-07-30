import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  user: {
    id?: string;
    user_metadata?: {
      full_name?: string;
    };
    email?: string;
  } | null;
  isDark: boolean;
  onToggleTheme?: () => void;
}

export default function Header({ user, isDark, onToggleTheme }: HeaderProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animações
  const pulseAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  const floatAnim1 = new Animated.Value(0);
  const floatAnim2 = new Animated.Value(0);
  const floatAnim3 = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  const themeColors = isDark
    ? {
        gradient: ['#6B7280', '#374151'] as const, // Cinza suave para escuro
        text: '#F9FAFB',
        accent: 'rgba(249, 250, 251, 0.15)',
        cardBg: 'rgba(249, 250, 251, 0.08)',
        border: 'rgba(249, 250, 251, 0.2)'
      }
    : {
        gradient: ['#8B7355', '#6B5B73'] as const, // Tons terrosos e aconchegantes
        text: '#FFFFFF',
        accent: 'rgba(255, 255, 255, 0.15)',
        cardBg: 'rgba(255, 255, 255, 0.12)',
        border: 'rgba(255, 255, 255, 0.2)'
      };

  // Animação de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();

    // Animação de pulso contínua para o ícone do tempo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Animações flutuantes para decorações
    const floatingAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim3, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    floatingAnimation1.start();
    // Delay para criar movimento assíncrono
    setTimeout(() => floatingAnimation2.start(), 1000);
    setTimeout(() => floatingAnimation3.start(), 500);

    return () => {
      pulseAnimation.stop();
      floatingAnimation1.stop();
      floatingAnimation2.stop();
      floatingAnimation3.stop();
    };
  }, []);

  // Atualizar horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          onPress: async () => {
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
  };

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  const handleOpenSettings = () => {
    router.push('/_settings');
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Bom dia',
        icon: 'weather-sunny' as const,
        period: 'manhã',
        bgIcon: '☀️',
        familyIcon: 'account-multiple' as const,
        message: 'Que seu dia seja produtivo!'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: 'Boa tarde',
        icon: 'weather-partly-cloudy' as const,
        period: 'tarde',
        bgIcon: '🌤️',
        familyIcon: 'account-group' as const,
        message: 'Continue com energia!'
      };
    } else {
      return {
        greeting: 'Boa noite',
        icon: 'weather-night' as const,
        period: 'noite',
        bgIcon: '🌙',
        familyIcon: 'account-heart' as const,
        message: 'Descanse bem!'
      };
    }
  };

  const getFamilyName = (): string => {
    const userName = user?.user_metadata?.full_name || 'Casa';
    return `${userName}`;
  };

  const getCurrentTime = (): string => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeInfo = getTimeOfDay();

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolações para animações flutuantes
  const float1Y = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const float1Rotate = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const float2Y = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const float2Scale = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const float3Y = floatAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const float3Rotate = floatAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={themeColors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      accessible
      accessibilityLabel="Cabeçalho da aplicação Casa em Dia"
    >
      <View style={styles.statusBarSpacer} />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.decorativeElements, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.floatingIcon,
            {
              top: 25,
              right: 70,
              transform: [
                { translateY: float1Y },
                { rotate: float1Rotate }
              ]
            }
          ]}
        >
          <View style={[styles.decorativeIconContainer, { backgroundColor: themeColors.cardBg }]}>
            <MaterialCommunityIcons name="heart" size={20} color={themeColors.text} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            {
              top: 70,
              right: 30,
              transform: [
                { translateY: float2Y },
                { scale: float2Scale }
              ]
            }
          ]}
        >
          <View style={[styles.decorativeIconContainer, styles.largeIcon, { backgroundColor: themeColors.cardBg }]}>
            <MaterialCommunityIcons name="home-heart" size={24} color={themeColors.text} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            {
              top: 45,
              left: 50,
              transform: [
                { translateY: float3Y },
                { rotate: float3Rotate }
              ]
            }
          ]}
        >
          <View style={[styles.decorativeIconContainer, styles.smallIcon, { backgroundColor: themeColors.cardBg }]}>
            <MaterialCommunityIcons name="star" size={14} color={themeColors.text} />
          </View>
        </Animated.View>

        {/* Elementos adicionais */}
        <Animated.View
          style={[
            styles.floatingIcon,
            {
              top: 30,
              left: 100,
              transform: [{ translateY: float1Y }]
            }
          ]}
        >
          <View style={[styles.decorativeIconContainer, styles.smallIcon, { backgroundColor: themeColors.cardBg }]}>
            <MaterialCommunityIcons name="account-group" size={12} color={themeColors.text} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingIcon,
            {
              top: 85,
              left: 20,
              transform: [
                { translateY: float2Y },
                { rotate: float1Rotate }
              ]
            }
          ]}
        >
          <View style={[styles.decorativeIconContainer, { backgroundColor: themeColors.cardBg }]}>
            <MaterialCommunityIcons name="calendar-heart" size={18} color={themeColors.text} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateX: slideInterpolate }]
          }
        ]}
      >
        <View style={styles.brandSection}>
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }]
            }}
          >
            <View style={[styles.logoContainer, {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border
            }]}>
              <MaterialCommunityIcons
                name="home-variant"
                size={26}
                color={themeColors.text}
              />
            </View>
          </Animated.View>
          <View style={styles.appTitleContainer}>
            <Text style={[styles.appName, { color: themeColors.text }]}>
              Casa em Dia
            </Text>
            <Text style={[styles.appSubtitle, { color: themeColors.text }]}>
              Organização Familiar
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border
              }]}
              onPress={handleToggleTheme}
              accessibilityLabel={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              <MaterialCommunityIcons
                name={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border
            }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityLabel="Sair da conta"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={themeColors.text} />
            ) : (
              <MaterialCommunityIcons
                name="logout-variant"
                size={18}
                color={themeColors.text}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border
            }]}
            onPress={handleOpenSettings}
            accessibilityLabel="Configurações"
          >
            <MaterialCommunityIcons
              name="cog"
              size={18}
              color={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Family Greeting Card */}
      <View style={[styles.greetingCard, {
        backgroundColor: themeColors.cardBg,
        borderColor: themeColors.border
      }]}>
        <View style={styles.greetingHeader}>
          <Animated.View
            style={[
              styles.timeIconContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <MaterialCommunityIcons
              name={timeInfo.icon}
              size={28}
              color={themeColors.text}
            />
          </Animated.View>

          <View style={styles.greetingTextContainer}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>
              {timeInfo.greeting}!
            </Text>
            <View style={styles.familyInfo}>
              <MaterialCommunityIcons
                name={timeInfo.familyIcon}
                size={16}
                color={themeColors.text}
                style={{ opacity: 0.8 }}
              />
              <Text style={[styles.familyName, { color: themeColors.text }]}>
                {getFamilyName()}
              </Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Text style={[styles.currentTime, { color: themeColors.text }]}>
              {getCurrentTime()}
            </Text>
            <Text style={[styles.period, { color: themeColors.text }]}>
              {timeInfo.period}
            </Text>
          </View>
        </View>

        {/* Family Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar-check" size={16} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.text }]}>Tarefas</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.text }]}>Família</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="home-heart" size={16} color={themeColors.text} />
            <Text style={[styles.statText, { color: themeColors.text }]}>Casa</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative',
  },
  statusBarSpacer: {
    height: 44,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
  },
  decorativeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    opacity: 0.7,
  },
  largeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 20,
    zIndex: 1,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appTitleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  greetingCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  greetingTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  familyName: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  period: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
});