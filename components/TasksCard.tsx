import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

interface Task {
  id: number;
  title: string;
  done: boolean;
  assignee: string;
  points: number;
  due_date: string | null;
}

interface TasksCardProps {
  tasks: Task[];
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
  toggleTask: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  maxHeight?: number;
  showProgress?: boolean;
  showEmptyState?: boolean;
}

export default function TasksCard({
  tasks,
  progressPercentage,
  completedTasks,
  totalTasks,
  toggleTask,
  deleteTask,
  maxHeight = 300,
  showProgress = true,
  showEmptyState = true,
}: TasksCardProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);

  const calculatedCompletedTasks = completedTasks ?? tasks.filter(task => task.done).length;
  const calculatedTotalTasks = totalTasks ?? tasks.length;
  const calculatedProgressPercentage = progressPercentage ??
    (calculatedTotalTasks > 0 ? (calculatedCompletedTasks / calculatedTotalTasks) * 100 : 0);

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem data limite';
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Atrasado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Amanhã';
    } else if (diffDays <= 7) {
      return `Em ${diffDays} dias`;
    } else {
      return taskDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getDateColor = (date: string | null) => {
    if (!date) return Colors.light.mutedText;
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return Colors.light.danger;
    if (diffDays === 0) return Colors.light.warning;
    if (diffDays === 1) return Colors.light.accentYellow;
    if (diffDays <= 3) return Colors.light.success;
    return Colors.light.mutedText;
  };

  const getTaskPriority = (task: Task) => {
    if (task.done) return 'completed';
    if (!task.due_date) return 'normal';

    const taskDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'important';
    return 'normal';
  };

  const handleToggleTask = async (taskId: number) => {
    if (loadingTaskId) return;

    setLoadingTaskId(taskId);
    try {
      await toggleTask(taskId);
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status da tarefa.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir a tarefa "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
            } catch (error) {
              console.error('Erro ao excluir tarefa:', error);
              Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
            }
          },
        },
      ]
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { overdue: 0, urgent: 1, important: 2, normal: 3, completed: 4 };
    const aPriority = getTaskPriority(a);
    const bPriority = getTaskPriority(b);

    if (aPriority !== bPriority) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }
    return b.points - a.points;
  });

  if ((!tasks || tasks.length === 0) && showEmptyState) {
    return (
      <View style={[styles.tasksCard, { backgroundColor: Colors.light.cardBackground }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.light.primary + '30' }]}>
              <FontAwesome5 name="tasks" color={Colors.light.primary} size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>Tarefas</Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-all" size={60} color={Colors.light.primary} />
          <Text style={[styles.emptyStateTitle, { color: Colors.light.text }]}>Nenhuma tarefa por aqui!</Text>
          <Text style={[styles.emptyStateSubtitle, { color: Colors.light.mutedText }]}>
            Crie uma nova tarefa para começar a organizar!
          </Text>
          <TouchableOpacity
            style={styles.createTaskButton}
            activeOpacity={0.6}
            onPress={() => router.navigate('/(tabs)/AddTaskScreen')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={Colors.light.textWhite} />
            <Text style={[styles.createTaskButtonText, { color: Colors.light.textWhite }]}>
              Criar Tarefa
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <View style={[styles.tasksCard, { backgroundColor: Colors.light.cardBackground }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: Colors.light.primary + '30' }]}>
            <FontAwesome5 name="tasks" color={Colors.light.primary} size={20} />
          </View>
          <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
            Tarefas ({calculatedTotalTasks})
          </Text>
        </View>
      </View>

      {showProgress && calculatedTotalTasks > 0 && (
        <View style={styles.taskProgress}>
          <View style={[styles.taskProgressBar, { backgroundColor: Colors.light.progressBackground }]}>
            <Animated.View style={[
              styles.taskProgressFill,
              { width: `${calculatedProgressPercentage}%`, backgroundColor: Colors.light.progressBar }
            ]} />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.taskProgressText, { color: Colors.light.mutedText }]}>
              {calculatedCompletedTasks} de {calculatedTotalTasks} concluídas
            </Text>
            <Text style={[styles.taskProgressPercentage, { color: Colors.light.primary }]}>
              {Math.round(calculatedProgressPercentage)}%
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={[styles.tasksList, { maxHeight }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {sortedTasks.map((task) => {
          const priority = getTaskPriority(task);
          const isLoading = loadingTaskId === task.id;

          return (
            <View
              key={task.id}
              style={[
                styles.taskItem,
                {
                  backgroundColor: Colors.light.backgroundSecondary + '90',
                  borderLeftWidth: 4,
                  borderLeftColor: task.done ? Colors.light.success : getDateColor(task.due_date),
                  borderColor: Colors.light.borderLight,
                  opacity: task.done ? 0.7 : 1,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleToggleTask(task.id)}
                style={[
                  styles.checkbox,
                  {
                    borderColor: task.done ? Colors.light.success : Colors.light.mutedText,
                    backgroundColor: task.done ? Colors.light.success : Colors.light.cardBackground,
                  }
                ]}
                activeOpacity={0.6}
                disabled={isLoading}
              >
                {isLoading ? (
                  <MaterialCommunityIcons name="loading" color={Colors.light.mutedText} size={18} />
                ) : task.done ? (
                  <MaterialCommunityIcons name="check" color={Colors.light.textWhite} size={18} />
                ) : null}
              </TouchableOpacity>

              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskText,
                    {
                      textDecorationLine: task.done ? 'line-through' : 'none',
                      color: task.done ? Colors.light.mutedText : Colors.light.text,
                    }
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>

                <View style={styles.taskMeta}>
                  <View style={styles.taskAssigneeContainer}>
                    <MaterialCommunityIcons name="account" size={18} color={Colors.light.mutedText} />
                    <Text style={[styles.taskAssignee, { color: Colors.light.mutedText }]}>
                      {task.assignee}
                    </Text>
                  </View>

                  <View style={styles.taskPoints}>
                    <MaterialCommunityIcons name="star" size={18} color={Colors.light.primary} />
                    <Text style={[styles.taskPointsText, { color: Colors.light.primary }]}>{task.points}</Text>
                  </View>
                </View>

                {task.due_date && (
                  <View style={styles.taskDateContainer}>
                    <MaterialCommunityIcons
                      name={priority === 'overdue' ? 'alert-circle' : 'calendar'}
                      size={16}
                      color={getDateColor(task.due_date)}
                    />
                    <Text style={[styles.taskDueDate, { color: getDateColor(task.due_date) }]}>
                      {formatDate(task.due_date)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteTask(task.id)}
                style={styles.deleteButton}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="delete-outline" size={24} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tasksCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    padding: 12,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  taskProgress: {
    marginBottom: 24,
  },
  taskProgressBar: {
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskProgressText: {
    fontSize: 15,
    fontWeight: '500',
  },
  taskProgressPercentage: {
    fontSize: 15,
    fontWeight: '700',
  },
  tasksList: {
    // maxHeight será definida via props
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  checkbox: {
    height: 26,
    width: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
    paddingRight: 12,
  },
  taskText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskAssigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskAssignee: {
    fontSize: 15,
    fontWeight: '500',
  },
  taskPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskPointsText: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDueDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginTop: -2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  createTaskButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});