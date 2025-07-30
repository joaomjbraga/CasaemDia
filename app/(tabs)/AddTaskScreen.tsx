import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskForm from '../../components/TaskForm';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyMembers } from '../../contexts/FamilyMembersContext';
import { supabase } from '../../lib/supabase';

type TabType = 'nova' | 'rapida' | 'template';

export default function AddTaskScreen() {
  const { user } = useAuth();
  const { familyMembers } = useFamilyMembers();
  const [activeTab, setActiveTab] = useState<TabType>('nova');

  const tabs = [
    { id: 'nova' as TabType, title: 'Nova Tarefa', icon: 'plus' },
    { id: 'rapida' as TabType, title: 'Tarefa Rápida', icon: 'flash' },
    { id: 'template' as TabType, title: 'Template', icon: 'content-copy' },
  ];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nova':
        return <TaskForm addTask={addTask} />;
      case 'rapida':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.contentText, { color: Colors.light.text }]}>
              Criação rápida de tarefas com configurações padrão
            </Text>
          </View>
        );
      case 'template':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.contentText, { color: Colors.light.text }]}>
              Selecione um template de tarefa predefinido
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.light.background }]}>
        <Text style={[styles.headerTitle, { color: Colors.light.text }]}>Adicionar Tarefa</Text>
        <Text style={[styles.headerSubtitle, { color: Colors.light.tabIconDefault }]}>
          Organize suas tarefas domésticas
        </Text>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: Colors.light.background }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, { backgroundColor: activeTab === tab.id ? Colors.light.tint : 'transparent' }]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? Colors.light.background : Colors.light.tabIconDefault}
            />
            <Text
              style={[styles.tabText, {
                color: activeTab === tab.id ? Colors.light.background : Colors.light.tabIconDefault,
                fontWeight: activeTab === tab.id ? '600' : '500',
              }]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  contentText: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
});