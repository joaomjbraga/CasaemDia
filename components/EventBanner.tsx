import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { handleSupabaseError, supabase } from '../lib/supabase';

interface Event {
  id: number;
  title: string;
  event_time: string;
  type: string;
}

interface EventBannerProps {
  userId: string;
  onEventPress?: (event: Event) => void;
}

const EventBanner = ({ userId, onEventPress }: EventBannerProps) => {
  const colors = Colors.light;
  const navigation = useNavigation();
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchNextEvent();

      // Subscription para atualizações em tempo real
      const subscription = supabase
        .channel('events_banner')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE' && nextEvent?.id === payload.old.id) {
              // Se o evento excluído é o atualmente exibido, limpar ou buscar próximo
              setNextEvent(null);
              fetchNextEvent();
            } else {
              // Para outros eventos (INSERT, UPDATE), recarregar o próximo evento
              fetchNextEvent();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const fetchNextEvent = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_time, type')
        .eq('user_id', userId)
        .gte('event_time', now)
        .order('event_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw new Error('Erro ao buscar próximo evento: ' + error.message);
      }

      setNextEvent(data || null);
    } catch (err: unknown) {
      console.error('Erro ao buscar próximo evento:', handleSupabaseError(err, 'fetchNextEvent'));
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Tarefa Doméstica';
      case 'meeting':
        return 'Reunião/Evento';
      case 'shopping':
        return 'Compras';
      case 'expense':
        return 'Pagamento/Conta';
      default:
        return 'Compromisso';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task':
        return 'home-variant';
      case 'meeting':
        return 'calendar-account';
      case 'shopping':
        return 'cart';
      case 'expense':
        return 'currency-usd';
      default:
        return 'calendar-clock';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task':
        return colors.illustrationPurple;
      case 'meeting':
        return colors.accentBlue;
      case 'shopping':
        return colors.illustrationTeal;
      case 'expense':
        return colors.illustrationOrange;
      default:
        return colors.primary;
    }
  };

  const getTimeUntilEvent = (eventTime: string) => {
    const now = new Date();
    const event = new Date(eventTime);
    const diffMs = event.getTime() - now.getTime();

    if (diffMs < 0) return 'Evento passado';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Em ${diffHours}h ${diffMinutes}min`;
    } else if (diffMinutes > 0) {
      return `Em ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Agora';
    }
  };

  const formatEventDateTime = (eventTime: string) => {
    const date = new Date(eventTime);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBannerPress = () => {
    if (nextEvent) {
      try {
        // Navegar para a tela de detalhes dos eventos, passando o ID do evento atual
        (navigation as any).navigate('EventDetailsScreen', { eventId: nextEvent.id });
      } catch (error) {
        console.log('Erro na navegação:', error);
        // Fallback para o callback se a navegação falhar
        if (onEventPress) {
          onEventPress(nextEvent);
        }
      }
    } else {
      // Se não há próximo evento, navegar para a tela de eventos sem ID específico
      try {
        (navigation as any).navigate('EventDetailsScreen');
      } catch (error) {
        console.log('Erro na navegação:', error);
      }
    }
  };

  // Não renderizar se ainda está carregando
  if (loading) {
    return null;
  }

  // Se não há eventos próximos, mostrar um banner diferente
  if (!nextEvent) {
    return (
      <TouchableOpacity
        style={[
          styles.banner,
          styles.noEventsBanner,
          {
            backgroundColor: colors.cardBackground,
            borderLeftColor: colors.mutedText,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={handleBannerPress}
        activeOpacity={0.8}
      >
        <View style={styles.bannerContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.mutedText + '15' }]}>
            <MaterialCommunityIcons name="calendar-plus" size={24} color={colors.mutedText} />
          </View>

          <View style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>
              Nenhum compromisso próximo
            </Text>
            <Text style={[styles.eventType, { color: colors.mutedText }]}>
              Toque para ver todos os compromissos
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const eventColor = getEventColor(nextEvent.type);
  const timeUntil = getTimeUntilEvent(nextEvent.event_time);
  const isUrgent = new Date(nextEvent.event_time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // Menos de 24 horas

  return (
    <TouchableOpacity
      style={[
        styles.banner,
        {
          backgroundColor: colors.cardBackground,
          borderLeftColor: eventColor,
          borderColor: colors.borderLight,
          shadowColor: colors.illustrationPurple,
        },
      ]}
      onPress={handleBannerPress}
      activeOpacity={0.8}
    >
      <View style={[styles.gradientOverlay, { backgroundColor: eventColor + '08' }]} />
      <View style={styles.bannerContent}>
        <View style={[styles.iconContainer, { backgroundColor: eventColor + '15' }]}>
          <MaterialCommunityIcons
            name={getEventIcon(nextEvent.type) as any}
            size={24}
            color={eventColor}
          />
        </View>

        <View style={styles.eventInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
              {nextEvent.title}
            </Text>
            {isUrgent && (
              <View style={[styles.urgentBadge, { backgroundColor: colors.illustrationOrange }]}>
                <MaterialCommunityIcons
                  name="alert"
                  size={10}
                  color={colors.textWhite}
                  style={{ marginRight: 2 }}
                />
                <Text style={[styles.urgentText, { color: colors.textWhite }]}>Urgente</Text>
              </View>
            )}
          </View>

          <Text style={[styles.eventType, { color: eventColor }]}>
            {getEventTypeLabel(nextEvent.type)}
          </Text>

          <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={12}
                color={colors.mutedText}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.eventTime, { color: colors.mutedText }]}>
                {formatEventDateTime(nextEvent.event_time)}
              </Text>
            </View>
            <View
              style={[
                styles.timeUntilBadge,
                {
                  backgroundColor: isUrgent ? colors.illustrationOrange + '20' : colors.accentCyan + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.timeUntil,
                  {
                    color: isUrgent ? colors.illustrationOrange : colors.accentCyan,
                  },
                ]}
              >
                {timeUntil}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={eventColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderWidth: 1,
    shadowColor: '#8B5FBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  noEventsBanner: {
    borderLeftWidth: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeUntilBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  timeUntil: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  arrowContainer: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default EventBanner;