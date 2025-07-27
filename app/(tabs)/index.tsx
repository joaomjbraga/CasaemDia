import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import BalanceCard from '../../components/BalanceCard';
import Header from '../../components/Header';
import QuickActions from '../../components/QuickActions';
import RankingCard from '../../components/RankingCard';
import StatsCard from '../../components/StatsCard';
import TasksCard from '../../components/TasksCard';

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, loading } = useAuth();

  const tasks = [
    { id: 1, title: 'Lavar roupa', done: true, assignee: 'Anne', points: 15 },
    { id: 2, title: 'Levar lixo', done: false, assignee: 'João', points: 10 },
    { id: 3, title: 'Comprar frutas', done: false, assignee: 'Anne', points: 8 },
    { id: 4, title: 'Limpar banheiro', done: true, assignee: 'João', points: 20 },
  ];

  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const coupleStats = {
    maria: { name: 'Anne', points: 145, avatar: '👩🏻', tasksCompleted: 12 },
    joao: { name: 'João', points: 132, avatar: '👨🏻', tasksCompleted: 10 }
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Carregando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#F4CE14' : '#3E8E7E'}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header user={user} isDark={isDark} />
        <StatsCard
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          theme={theme}
          isDark={isDark}
        />
        <BalanceCard isDark={isDark} theme={theme} />
        <RankingCard coupleStats={coupleStats} theme={theme} isDark={isDark} />
        <TasksCard
          tasks={tasks}
          progressPercentage={progressPercentage}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          theme={theme}
          isDark={isDark}
        />
        <QuickActions theme={theme} isDark={isDark} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
});