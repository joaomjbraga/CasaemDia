import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  user: {
    id?: string;
    user_metadata?: {
      full_name?: string;
    };
    email?: string;
  } | null;
  isDark: boolean;
  onOpenSettings?: () => void;
}

export default function Header({ user, isDark, onOpenSettings }: HeaderProps) {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const themeColors = isDark
    ? { gradient: ['#C9F31D', '#9AB821'] as const, text: '#010101', accent: 'rgba(255, 255, 255, 0.1)' }
    : { gradient: ['#3E8E7E', '#2D6B5F'] as const, text: '#FFFFFF', accent: 'rgba(255, 255, 255, 0.1)' };

  // Atualizar horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

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

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Bom dia',
        icon: 'weather-sunny' as const,
        period: 'manhã'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: 'Boa tarde',
        icon: 'weather-partly-cloudy' as const,
        period: 'tarde'
      };
    } else {
      return {
        greeting: 'Boa noite',
        icon: 'weather-night' as const,
        period: 'noite'
      };
    }
  };

  const getFamilyEmail = (): string => {
    return user?.email || 'familia@exemplo.com';
  };

  const timeInfo = getTimeOfDay();

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandSection}>
          <MaterialCommunityIcons
            name="home-variant-outline"
            size={24}
            color={themeColors.text}
          />
          <Text style={[styles.appName, { color: themeColors.text }]}>
            Casa em Dia
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityLabel="Sair da conta"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={themeColors.text} />
            ) : (
              <MaterialCommunityIcons
                name="logout-variant"
                size={20}
                color={themeColors.text}
              />
            )}
          </TouchableOpacity>

          {onOpenSettings && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onOpenSettings}
              accessibilityLabel="Configurações"
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={themeColors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Time-based Greeting */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingContent}>
          <MaterialCommunityIcons
            name={timeInfo.icon}
            size={20}
            color={themeColors.text}
            style={styles.timeIcon}
          />
          <View style={styles.textContent}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>
              {timeInfo.greeting}
            </Text>
            <Text style={[styles.familyEmail, { color: themeColors.text }]}>
              {getFamilyEmail()}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: themeColors.accent }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  statusBarSpacer: {
    height: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 20,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    opacity: 0.9,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 12,
    opacity: 0.9,
  },
  textContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  familyEmail: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
  },
  divider: {
    height: 1,
    marginHorizontal: -24,
    opacity: 0.2,
  },
});