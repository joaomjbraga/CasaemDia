import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import TaskForm from '../../components/TaskForm';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyMembers } from '../../contexts/FamilyMembersContext';
import { supabase } from '../../lib/supabase';

export default function AddTaskScreen() {
  const { user } = useAuth();
  const { familyMembers } = useFamilyMembers();

  // Função para adicionar tarefa ao Supabase
  const addTask = async (title: string, assigneeId: number, points: number, due_date: string | null) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

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

      Alert.alert('Sucesso', 'Tarefa criada com sucesso!');
      console.log('Tarefa adicionada:', data);
    } catch (error) {
      console.error('Erro inesperado ao adicionar tarefa:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.light.background }]}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={36}
            color={Colors.light.primary}
          />
        </View>
        <Text style={[styles.headerTitle, { color: Colors.light.text }]}>Nova Tarefa</Text>
        <Text style={[styles.headerSubtitle, { color: Colors.light.mutedText }]}>
          Organize suas tarefas domésticas
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <TaskForm addTask={addTask} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerIconContainer: {
    backgroundColor: Colors.light.backgroundSecondary + '90',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
});