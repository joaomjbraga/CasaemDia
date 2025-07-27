import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import BalanceCard from '../../components/BalanceCard';
import Header from '../../components/Header';
import QuickActions from '../../components/QuickActions';
import RankingCard from '../../components/RankingCard';
import StatsCard from '../../components/StatsCard';
import TasksCard from '../../components/TasksCard';

interface Task {
  id: number;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
}

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const coupleStats = {
    maria: { name: 'Anne', points: 145, avatar: '👩🏻', tasksCompleted: 12 },
    joao: { name: 'João', points: 132, avatar: '👨🏻', tasksCompleted: 10 }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setTasksLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar tarefas:', error);
        Alert.alert('Erro', 'Não foi possível carregar as tarefas.');
        return;
      }
      setTasks(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar tarefas:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    } finally {
      setTasksLoading(false);
    }
  };

  const toggleTask = async (id: number) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !task.done })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
        return;
      }
      setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
    } catch (error) {
      console.error('Erro inesperado ao atualizar tarefa:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  const addTask = async (title: string, assignee: string, points: number) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title, assignee, points, user_id: user.id, done: false }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar tarefa:', error);
        Alert.alert('Erro', 'Não foi possível adicionar a tarefa.');
        return;
      }
      setTasks([data, ...tasks]);
    } catch (error) {
      console.error('Erro inesperado ao adicionar tarefa:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  const deleteTask = async (id: number) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
        return;
      }
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro inesperado ao excluir tarefa:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  if (loading || tasksLoading) {
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
          toggleTask={toggleTask}
          addTask={addTask}
          deleteTask={deleteTask}
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