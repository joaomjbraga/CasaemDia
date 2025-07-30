import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

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
  onViewAll?: () => void;
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
  onViewAll,
  maxHeight = 300,
  showProgress = true,
  showEmptyState = true,
}: TasksCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
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
    if (!date) return colors.tabIconDefault;
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '#FF6B6B';
    if (diffDays === 0) return '#FFB800';
    if (diffDays === 1) return '#FFA726';
    if (diffDays <= 3) return '#66BB6A';
    return colors.tabIconDefault;
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
      <View style={[styles.tasksCard, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome5 name="tasks" color={colors.tint} size={16} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarefas</Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-all" size={48} color={colors.tabIconDefault} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Nenhuma tarefa por aqui!</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.tabIconDefault }]}>
            Que tal criar uma nova tarefa?
          </Text>
        </View>
      </View>
    );
  }

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <View style={[styles.tasksCard, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.tint + '20' }]}>
            <FontAwesome5 name="tasks" color={colors.tint} size={16} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tarefas ({calculatedTotalTasks})
          </Text>
        </View>
        {onViewAll && calculatedTotalTasks > 0 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={[styles.viewAllText, { color: colors.tint }]}>Ver todas</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.tint} />
          </TouchableOpacity>
        )}
      </View>

      {showProgress && calculatedTotalTasks > 0 && (
        <View style={styles.taskProgress}>
          <View style={[styles.taskProgressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <Animated.View style={[
              styles.taskProgressFill,
              { width: `${calculatedProgressPercentage}%`, backgroundColor: colors.tint }
            ]} />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.taskProgressText, { color: colors.tabIconDefault }]}>
              {calculatedCompletedTasks} de {calculatedTotalTasks} concluídas
            </Text>
            <Text style={[styles.taskProgressPercentage, { color: colors.tint }]}>
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
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderLeftWidth: 3,
                  borderLeftColor: task.done ? colors.tint : getDateColor(task.due_date),
                  opacity: task.done ? 0.7 : 1,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleToggleTask(task.id)}
                style={[
                  styles.checkbox,
                  {
                    borderColor: task.done ? colors.tint : colors.tabIconDefault,
                    backgroundColor: task.done ? colors.tint : 'transparent'
                  }
                ]}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <MaterialCommunityIcons name="loading" color={colors.tabIconDefault} size={14} />
                ) : task.done ? (
                  <MaterialCommunityIcons name="check" color={colors.background} size={14} />
                ) : null}
              </TouchableOpacity>

              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskText,
                    {
                      textDecorationLine: task.done ? 'line-through' : 'none',
                      color: task.done ? colors.tabIconDefault : colors.text
                    }
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>

                <View style={styles.taskMeta}>
                  <View style={styles.taskAssigneeContainer}>
                    <MaterialCommunityIcons name="account" size={14} color={colors.tabIconDefault} />
                    <Text style={[styles.taskAssignee, { color: colors.tabIconDefault }]}>
                      {task.assignee}
                    </Text>
                  </View>

                  <View style={styles.taskPoints}>
                    <MaterialCommunityIcons name="star" size={14} color={colors.tint} />
                    <Text style={[styles.taskPointsText, { color: colors.tint }]}>{task.points}</Text>
                  </View>
                </View>

                {task.due_date && (
                  <View style={styles.taskDateContainer}>
                    <MaterialCommunityIcons
                      name={priority === 'overdue' ? 'alert-circle' : 'calendar'}
                      size={12}
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
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color={colors.tabIconDefault} />
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
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskProgress: {
    marginBottom: 20,
  },
  taskProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskProgressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskProgressPercentage: {
    fontSize: 13,
    fontWeight: '700',
  },
  tasksList: {
    // maxHeight será definida via props
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    height: 22,
    width: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
    paddingRight: 8,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskAssigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskAssignee: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskPointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginTop: -4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});