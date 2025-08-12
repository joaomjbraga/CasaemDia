import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/Colors';

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'task' | 'expense' | 'shopping' | 'meeting';
}

const CalendarScreen = () => {
  const colors = Colors.light;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Eventos de exemplo
  const events: Event[] = [
    { id: '1', title: 'Reunião de equipe', time: '09:00', type: 'meeting' },
    { id: '2', title: 'Comprar mantimentos', time: '14:30', type: 'shopping' },
    { id: '3', title: 'Relatório mensal', time: '16:00', type: 'task' },
    { id: '4', title: 'Pagamento conta luz', time: '18:00', type: 'expense' },
  ];

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'task': return colors.illustrationPurple;
      case 'expense': return colors.illustrationPink;
      case 'shopping': return colors.accentCyan;
      case 'meeting': return colors.illustrationOrange;
      default: return colors.primary;
    }
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'task': return 'list-status';
      case 'expense': return 'account-cash';
      case 'shopping': return 'view-list';
      case 'meeting': return 'account-group';
      default: return 'calendar';
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

    // Dias do mês anterior para preencher o início
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length; // 6 semanas × 7 dias
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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendário</Text>
        <TouchableOpacity style={[styles.todayButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.todayButtonText, { color: colors.textWhite }]}>Hoje</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Navegação do Mês */}
        <View style={[styles.monthNavigation, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            style={styles.navButton}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text style={[styles.monthYear, { color: colors.text }]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            style={styles.navButton}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Dias da Semana */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayItem}>
              <Text style={[styles.weekDayText, { color: colors.mutedText }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Grade do Calendário */}
        <View style={[styles.calendarGrid, { backgroundColor: colors.cardBackground }]}>
          {getDaysInMonth(currentMonth).map((item, index) => {
            const isSelected = isDateSelected(item.date);
            const isTodayDate = isToday(item.date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  isSelected && { backgroundColor: colors.primary },
                  isTodayDate && !isSelected && {
                    backgroundColor: colors.progressBackground,
                    borderColor: colors.accentBlue,
                    borderWidth: 1
                  }
                ]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: item.isCurrentMonth ? colors.text : colors.mutedText },
                    isSelected && { color: colors.textWhite, fontWeight: '600' },
                    isTodayDate && !isSelected && { color: colors.accentBlue, fontWeight: '600' }
                  ]}
                >
                  {item.date.getDate()}
                </Text>

                {/* Indicador de eventos */}
                {item.isCurrentMonth && item.date.getDate() === 15 && (
                  <View style={[styles.eventDot, { backgroundColor: colors.illustrationPink }]} />
                )}
                {item.isCurrentMonth && item.date.getDate() === 22 && (
                  <View style={[styles.eventDot, { backgroundColor: colors.accentCyan }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Eventos do Dia Selecionado */}
        <View style={[styles.eventsSection, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.eventsSectionHeader}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.eventsSectionTitle, { color: colors.text }]}>
              Eventos de {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
            </Text>
          </View>

          {events.map((event) => (
            <View key={event.id} style={[styles.eventItem, { borderLeftColor: getEventColor(event.type) }]}>
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <MaterialCommunityIcons
                    name={getEventIcon(event.type)}
                    size={16}
                    color={getEventColor(event.type)}
                  />
                  <Text style={[styles.eventTitle, { color: colors.text }]}>
                    {event.title}
                  </Text>
                </View>
                <Text style={[styles.eventTime, { color: colors.mutedText }]}>
                  {event.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resumo Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={24}
              color={colors.illustrationPurple}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Tarefas</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={colors.illustrationOrange}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>5</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Reuniões</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color={colors.accentCyan}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>85%</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Concluído</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
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
    marginTop: 16,
    marginBottom: 8,
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
    padding: 8,
  },
  dayItem: {
    width: '14.285%', // 100% / 7 dias
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
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
    padding: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
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
});

export default CalendarScreen;