import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import AddTaskForm from '../../components/AddTaskForm';
import Colors from '../../constants/Colors';
import { handleSupabaseError, supabase } from '../../lib/supabase';

type IconName = 'list-status' | 'check-circle' | 'calendar-today' | 'chevron-left' | 'chevron-right' | 'calendar-check' | 'plus';

interface Event {
  id: string;
  title: string;
  time: string;
  eventTime: string;
  type: string;
  description?: string;
}

const CalendarScreen = () => {
  const colors = Colors.light;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Função para buscar o usuário logado
  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error('Erro ao obter usuário: ' + error.message);
      }
      if (user) {
        setUserId(user.id);
      } else {
        throw new Error('Nenhum usuário logado.');
      }
    } catch (err: unknown) {
      setError(handleSupabaseError(err, 'fetchUser'));
      setLoading(false);
    }
  };

  // Função para buscar eventos do Supabase
  const fetchEvents = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_time, type, description')
        .eq('user_id', userId)
        .gte('event_time', startOfMonth.toISOString())
        .lte('event_time', endOfMonth.toISOString())
        .order('event_time', { ascending: true });

      if (error) {
        throw new Error('Erro ao buscar eventos: ' + error.message);
      }

      const mappedEvents: Event[] = data.map((event) => ({
        id: event.id.toString(),
        title: event.title,
        time: event.event_time
          ? new Date(event.event_time).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })
          : 'Sem horário',
        eventTime: event.event_time || '',
        type: event.type,
        description: event.description,
      }));

      setEvents(mappedEvents);
    } catch (err: unknown) {
      setError(handleSupabaseError(err, 'fetchEvents'));
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar usuário ao montar o componente
  useEffect(() => {
    fetchUser();
  }, []);

  // Efeito para buscar eventos quando o userId ou currentMonth mudar
  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId, currentMonth]);

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'task':
        return colors.illustrationPurple;
      case 'meeting':
        return colors.accentBlue;
      case 'shopping':
        return colors.success;
      case 'expense':
        return colors.danger;
      default:
        return colors.illustrationPurple;
    }
  };

  const getEventIcon = (eventType: string): IconName => {
    switch (eventType) {
      case 'task':
        return 'list-status';
      case 'meeting':
        return 'calendar-today';
      case 'shopping':
        return 'list-status';
      case 'expense':
        return 'list-status';
      default:
        return 'list-status';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasEventsOnDate = (date: Date) => {
    return events.some((event) => {
      if (!event.eventTime) return false;
      const eventDate = new Date(event.eventTime).toDateString();
      return eventDate === date.toDateString();
    });
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={'#fff'} barStyle="dark-content" />
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendário</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: colors.primary }]}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={[styles.todayButtonText, { color: colors.textWhite }]}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setAddTaskModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.monthNavigation, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayItem}>
              <Text style={[styles.weekDayText, { color: colors.mutedText }]}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.calendarGrid, { backgroundColor: colors.cardBackground }]}>
          {getDaysInMonth(currentMonth).map((item, index) => {
            const isSelected = isDateSelected(item.date);
            const isTodayDate = isToday(item.date);
            const hasEvents = hasEventsOnDate(item.date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  isSelected && { backgroundColor: colors.primary },
                  isTodayDate &&
                  !isSelected && {
                    backgroundColor: colors.progressBackground,
                    borderColor: colors.accentBlue,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: item.isCurrentMonth ? colors.text : colors.mutedText },
                    isSelected && { color: colors.textWhite, fontWeight: '600' },
                    isTodayDate && !isSelected && { color: colors.accentBlue, fontWeight: '600' },
                  ]}
                >
                  {item.date.getDate()}
                </Text>
                {item.isCurrentMonth && hasEvents && (
                  <View style={[styles.eventDot, { backgroundColor: colors.illustrationPurple }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.eventsSection, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.eventsSectionHeader}>
            <MaterialCommunityIcons name="calendar-today" size={20} color={colors.primary} />
            <Text style={[styles.eventsSectionTitle, { color: colors.text }]}>
              Compromissos de {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
            </Text>
          </View>

          {events
            .filter((event) =>
              event.eventTime
                ? new Date(event.eventTime).toDateString() === selectedDate.toDateString()
                : false
            )
            .map((event) => (
              <View
                key={event.id}
                style={[styles.eventItem, { borderLeftColor: getEventColor(event.type) }]}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <MaterialCommunityIcons
                      name={getEventIcon(event.type)}
                      size={16}
                      color={getEventColor(event.type)}
                    />
                    <Text
                      style={[
                        styles.eventTitle,
                        { color: colors.text },
                      ]}
                    >
                      {event.title}
                    </Text>
                  </View>
                  <Text style={[styles.eventTime, { color: colors.mutedText }]}>
                    {event.time}
                  </Text>
                  {event.description && (
                    <Text style={[styles.eventDetail, { color: colors.mutedText }]}>
                      {event.description}
                    </Text>
                  )}
                  <Text style={[styles.eventType, { color: colors.mutedText }]}>
                    Tipo: {event.type === 'task' ? 'Tarefa Doméstica' :
                      event.type === 'meeting' ? 'Reunião/Evento' :
                        event.type === 'shopping' ? 'Compras' :
                          event.type === 'expense' ? 'Pagamento/Conta' : event.type}
                  </Text>
                </View>
              </View>
            ))}

          {events.filter((event) =>
            event.eventTime
              ? new Date(event.eventTime).toDateString() === selectedDate.toDateString()
              : false
          ).length === 0 && (
              <Text style={[styles.noEventsText, { color: colors.mutedText }]}>
                Nenhum compromisso para este dia.
              </Text>
            )}
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={24}
              color={colors.illustrationPurple}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {events.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Compromissos</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={colors.success}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {events.filter((e) => e.type === 'task').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Tarefas</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        isVisible={isAddTaskModalVisible}
        onBackdropPress={() => {
          if (!isDatePickerVisible) {
            setAddTaskModalVisible(false);
          }
        }}
        style={styles.modal}
      >
        <AddTaskForm
          userId={userId}
          onClose={() => setAddTaskModalVisible(false)}
          onTaskAdded={fetchEvents}
          onToggleDatePicker={setDatePickerVisible}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    paddingTop: 70,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    width: '100%',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    width: '100%',
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    padding: 4,
    width: '100%',
  },
  dayItem: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 0.5,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    marginTop: 20,
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventItem: {
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 8,
    paddingLeft: 12,
    width: '100%',
  },
  eventContent: {
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    marginLeft: 24,
  },
  eventDetail: {
    fontSize: 12,
    marginLeft: 24,
    marginTop: 4,
  },
  eventType: {
    fontSize: 11,
    marginLeft: 24,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noEventsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modal: {
    justifyContent: 'center',
    margin: 0,
  },
});

export default CalendarScreen;