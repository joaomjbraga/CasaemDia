import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { handleSupabaseError, supabase } from '../../lib/supabase';

interface Event {
  id: number;
  title: string;
  event_time: string;
  type: string;
  description?: string;
  user_id: string;
  created_at: string;
}

type EventDetailsRouteProp = RouteProp<{
  EventDetails: {
    eventId?: number;
  };
}, 'EventDetails'>;

const EventDetailsScreen = () => {
  const colors = Colors.light;
  const navigation = useNavigation();
  const route = useRoute<EventDetailsRouteProp>();
  const { user } = useAuth();
  const eventId = route.params?.eventId;

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();

      // Subscription para atualizações em tempo real
      const subscription = supabase
        .channel('events_details')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          // Atualiza a lista de eventos quando há mudanças
          fetchEvents();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [eventId, events]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_time', { ascending: true });

      if (error) {
        throw new Error('Erro ao carregar eventos: ' + error.message);
      }

      setEvents(data || []);
    } catch (err: unknown) {
      setError(handleSupabaseError(err, 'fetchEvents'));
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (event: Event) => {
    Alert.alert(
      'Excluir Compromisso',
      'Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id);

              if (error) {
                throw new Error('Erro ao excluir evento: ' + error.message);
              }

              // Atualiza o estado local removendo o evento excluído
              setEvents((prevEvents) => prevEvents.filter((e) => e.id !== event.id));

              // Limpa a seleção se o evento excluído era o selecionado
              if (selectedEvent?.id === event.id) {
                setSelectedEvent(null);
              }

              Alert.alert('Sucesso', 'Compromisso excluído com sucesso!');
            } catch (err: unknown) {
              Alert.alert('Erro', handleSupabaseError(err, 'deleteEvent'));
            }
          },
        },
      ]
    );
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

    if (diffMs < 0) return { text: 'Evento passado', isPast: true };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return { text: `Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`, isPast: false };
    } else if (diffHours > 0) {
      return { text: `Em ${diffHours}h ${diffMinutes}min`, isPast: false };
    } else if (diffMinutes > 0) {
      return { text: `Em ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`, isPast: false };
    } else {
      return { text: 'Agora!', isPast: false };
    }
  };

  const formatEventDateTime = (eventTime: string) => {
    const date = new Date(eventTime);
    return {
      date: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const formatShortDateTime = (eventTime: string) => {
    const date = new Date(eventTime);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const separateEventsByDate = (events: Event[]) => {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.event_time) >= now);
    const past = events.filter(event => new Date(event.event_time) < now);
    return { upcoming, past };
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const eventColor = getEventColor(item.type);
    const timeInfo = getTimeUntilEvent(item.event_time);
    const isUrgent = new Date(item.event_time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
    const isSelected = selectedEvent?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          {
            backgroundColor: colors.cardBackground,
            borderLeftColor: eventColor,
            borderColor: isSelected ? eventColor : colors.borderLight,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedEvent(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.eventItemHeader]}>
          <View style={[styles.smallIconContainer, { backgroundColor: eventColor + '15' }]}>
            <MaterialCommunityIcons
              name={getEventIcon(item.type) as any}
              size={20}
              color={eventColor}
            />
          </View>
          <View style={styles.eventItemInfo}>
            <Text style={[styles.eventItemTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.eventItemType, { color: eventColor }]}>
              {getEventTypeLabel(item.type)}
            </Text>
            <Text style={[styles.eventItemTime, { color: colors.mutedText }]}>
              {formatShortDateTime(item.event_time)}
            </Text>
          </View>
          <View style={styles.eventItemActions}>
            {isUrgent && !timeInfo.isPast && (
              <View style={[styles.urgentDot, { backgroundColor: colors.illustrationOrange }]} />
            )}
            <TouchableOpacity
              onPress={() => deleteEvent(item)}
              style={styles.deleteButton}
            >
              <MaterialCommunityIcons name="delete" size={16} color={colors.illustrationOrange} />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.timeUntilBadgeSmall,
            {
              backgroundColor: timeInfo.isPast
                ? colors.mutedText + '20'
                : isUrgent
                  ? colors.illustrationOrange + '20'
                  : colors.accentCyan + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.timeUntilTextSmall,
              {
                color: timeInfo.isPast
                  ? colors.mutedText
                  : isUrgent
                    ? colors.illustrationOrange
                    : colors.accentCyan,
              },
            ]}
          >
            {timeInfo.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventDetails = () => {
    if (!selectedEvent) {
      return (
        <View style={styles.noSelectionContainer}>
          <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.mutedText} />
          <Text style={[styles.noSelectionText, { color: colors.mutedText }]}>
            Selecione um evento para ver os detalhes
          </Text>
        </View>
      );
    }

    const eventColor = getEventColor(selectedEvent.type);
    const timeInfo = getTimeUntilEvent(selectedEvent.event_time);
    const dateTime = formatEventDateTime(selectedEvent.event_time);
    const isUrgent = new Date(selectedEvent.event_time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

    return (
      <View style={[styles.eventDetailsCard, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.eventDetailsHeader, { borderBottomColor: colors.borderLight }]}>
          <View style={[styles.iconContainer, { backgroundColor: eventColor + '15' }]}>
            <MaterialCommunityIcons
              name={getEventIcon(selectedEvent.type) as any}
              size={32}
              color={eventColor}
            />
          </View>
          <View style={styles.eventHeaderInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>{selectedEvent.title}</Text>
            <Text style={[styles.eventType, { color: eventColor }]}>
              {getEventTypeLabel(selectedEvent.type)}
            </Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.mutedText} />
            <View style={styles.timeInfo}>
              <Text style={[styles.dateText, { color: colors.text }]}>{dateTime.date}</Text>
              <Text style={[styles.timeText, { color: colors.mutedText }]}>{dateTime.time}</Text>
            </View>
          </View>

          <View
            style={[
              styles.timeUntilBadge,
              {
                backgroundColor: timeInfo.isPast
                  ? colors.mutedText + '20'
                  : isUrgent
                    ? colors.illustrationOrange + '20'
                    : colors.accentCyan + '20',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={timeInfo.isPast ? 'clock-alert' : 'clock-outline'}
              size={16}
              color={timeInfo.isPast ? colors.mutedText : isUrgent ? colors.illustrationOrange : colors.accentCyan}
            />
            <Text
              style={[
                styles.timeUntilText,
                {
                  color: timeInfo.isPast
                    ? colors.mutedText
                    : isUrgent
                      ? colors.illustrationOrange
                      : colors.accentCyan,
                },
              ]}
            >
              {timeInfo.text}
            </Text>
          </View>
        </View>

        {/* Description */}
        {selectedEvent.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Descrição</Text>
            <Text style={[styles.descriptionText, { color: colors.mutedText }]}>
              {selectedEvent.description}
            </Text>
          </View>
        )}

        {/* Created Info */}
        <View style={[styles.createdSection, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.createdText, { color: colors.mutedText }]}>
            Criado em {new Date(selectedEvent.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor={'#fff'} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor={'#fff'} barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.illustrationOrange} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.textWhite }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { upcoming, past } = separateEventsByDate(events);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={'#fff'} barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.navigate('/(tabs)')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meus Compromissos</Text>
      </View>

      <View style={styles.content}>
        {/* Lista de eventos */}
        <View style={styles.eventsListContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.mutedText} />
                <Text style={[styles.noEventsText, { color: colors.mutedText }]}>
                  Nenhum compromisso encontrado
                </Text>
              </View>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                      Próximos Compromissos ({upcoming.length})
                    </Text>
                    <FlatList
                      data={upcoming}
                      renderItem={renderEventItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                    />
                  </>
                )}

                {past.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeaderText, { color: colors.text, marginTop: 24 }]}>
                      Compromissos Anteriores ({past.length})
                    </Text>
                    <FlatList
                      data={past}
                      renderItem={renderEventItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>

        {/* Detalhes do evento selecionado */}
        <View style={styles.eventDetailsContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderEventDetails()}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 70,
    shadowColor: '#8B5FBF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  eventsListContainer: {
    flex: 0.4,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.light.borderLight,
  },
  eventDetailsContainer: {
    flex: 0.6,
    padding: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noEventsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  eventItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#8B5FBF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  smallIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventItemInfo: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  eventItemType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventItemTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventItemActions: {
    alignItems: 'center',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  timeUntilBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeUntilTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  noSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  noSelectionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  eventDetailsCard: {
    borderRadius: 16,
    shadowColor: '#8B5FBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventDetailsHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  timeSection: {
    padding: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeUntilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeUntilText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: -0.1,
  },
  descriptionSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  createdSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  createdText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default EventDetailsScreen;