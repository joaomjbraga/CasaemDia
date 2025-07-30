import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyMembers } from '@/contexts/FamilyMembersContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BalanceCard from '../../components/BalanceCard';
import Header from '../../components/Header';
import QuickActions from '../../components/QuickActions';
import RankingCard from '../../components/RankingCard';
import TasksCard from '../../components/TasksCard';

interface Task {
  id: number;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  due_date: string | null;
}

interface CoupleStat {
  name: string;
  points: number;
  avatar: 'person' | 'person-outline' | 'trophy';
  tasksCompleted: number;
}

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, loading } = useAuth();
  const { familyMembers, fetchFamilyMembers, loading: familyMembersLoading } = useFamilyMembers();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Helper function to get family member ID by name
  const getFamilyMemberIdByName = (name: string): number | null => {
    const member = familyMembers.find(m => m.name === name);
    return member ? member.id : null;
  };

  // Helper function to validate if assignee name exists in family members
  const isValidAssignee = (name: string): boolean => {
    return familyMembers.some(m => m.name === name);
  };

  const updateCoupleStats = (): { [key: string]: CoupleStat } => {
    const stats: { [key: string]: CoupleStat } = {};

    // Initialize stats for all family members
    familyMembers.forEach((member, index) => {
      const memberTasks = tasks.filter(t => t.assignee === member.name);
      const points = memberTasks
        .filter(t => t.done)
        .reduce((sum, t) => sum + t.points, 0);
      const tasksCompleted = memberTasks.filter(t => t.done).length;

      stats[member.name] = {
        name: member.name,
        points,
        avatar: index % 2 === 0 ? 'person' : 'person-outline',
        tasksCompleted,
      };
    });

    return stats;
  };

  const coupleStats = updateCoupleStats();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchFamilyMembers();

      const subscription = supabase
        .channel('tasks')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchTasks();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setTasks([]);
      setTasksLoading(false);
    }
  }, [user, fetchFamilyMembers]);

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
        .select('id, title, done, assignee, points, due_date')
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

  const addTask = async (title: string, assigneeId: number, points: number, due_date: string | null) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    // Find the family member by ID and get their name
    const assignee = familyMembers.find(m => m.id === assigneeId);
    if (!assignee) {
      Alert.alert('Erro', 'Membro da família não encontrado.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title,
          assignee: assignee.name,
          points,
          user_id: user.id,
          done: false,
          due_date
        }])
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

  // Função para navegar para a tela de todas as tarefas
  const handleViewAllTasks = () => {
    console.log('Navegar para todas as tarefas');
  };

  // Função para ser passada para o TaskForm
  const handleAddTaskFromForm = async (title: string, assigneeId: number, points: number, due_date: string | null) => {
    await addTask(title, assigneeId, points, due_date);
  };

  if (loading || tasksLoading || familyMembersLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Header
            user={user}
          />
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <View style={styles.cardContainer}>
              <BalanceCard isDark={isDark} theme={theme} />
            </View>
            <View style={styles.cardContainer}>
              <RankingCard
                coupleStats={coupleStats}
                theme={theme}
                isDark={isDark}
              />
            </View>
          </ScrollView>
          <TasksCard
            tasks={tasks}
            progressPercentage={progressPercentage}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            onViewAll={handleViewAllTasks}
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
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  horizontalScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  cardContainer: {
    width: 320, // Ajustado para uma largura um pouco maior para melhor legibilidade
    height: 380, // Altura fixa para uniformizar os cards
    justifyContent: 'flex-start',
  },
});