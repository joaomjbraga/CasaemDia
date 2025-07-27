import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  theme: {
    text: string;
    background: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
    bgConainer: string
  };
  isDark: boolean;
  toggleTask: (id: number) => Promise<void>;
  addTask: (title: string, assignee: string, points: number, due_date: string | null) => void;
  deleteTask: (id: number) => void;
}

export default function TasksCard({
  tasks,
  progressPercentage,
  completedTasks,
  totalTasks,
  theme,
  isDark,
  toggleTask,
  addTask,
  deleteTask,
}: TasksCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAddTask = () => {
    if (!newTaskTitle || !newTaskAssignee || !newTaskPoints) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    const points = parseInt(newTaskPoints);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Erro', 'Os pontos devem ser um número maior que zero.');
      return;
    }
    const dueDate = newTaskDueDate ? newTaskDueDate.toISOString() : null;
    addTask(newTaskTitle, newTaskAssignee, points, dueDate);
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setNewTaskPoints('');
    setNewTaskDueDate(null);
  };

  const handleDeleteTask = (id: number) => {
    Alert.alert(
      'Excluir Tarefa',
      'Tem certeza que deseja excluir esta tarefa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: () => deleteTask(id),
          style: 'destructive',
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewTaskDueDate(selectedDate);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem data';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.tasksCard, { backgroundColor: isDark ? '#151515' : '#fffffff8' }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(164, 164, 164, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <FontAwesome5 name="tasks" color={theme.tint} size={16} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tarefas de Hoje</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: theme.tint }]}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.taskProgress}>
        <View style={[styles.taskProgressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
          <View style={[styles.taskProgressFill, { width: `${progressPercentage}%`, backgroundColor: theme.tint }]} />
        </View>
        <Text style={[styles.taskProgressText, { color: theme.tabIconDefault }]}>
          {completedTasks} de {totalTasks} concluídas ({Math.round(progressPercentage)}%)
        </Text>
      </View>

      <View style={styles.tasksList}>
        {tasks.map((task) => (
          <View key={task.id} style={[styles.taskItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <TouchableOpacity
              onPress={() => toggleTask(task.id)}
              style={[styles.checkbox, { borderColor: task.done ? theme.tint : theme.tabIconDefault, backgroundColor: task.done ? theme.tint : 'transparent' }]}
            >
              {task.done && (
                <MaterialCommunityIcons name="check" color={isDark ? '#FFFFFF' : '#1E1E1E'} size={14} />
              )}
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text
                style={[styles.taskText, { textDecorationLine: task.done ? 'line-through' : 'none', color: task.done ? theme.tabIconDefault : theme.text }]}
              >
                {task.title}
              </Text>
              <View style={styles.taskMeta}>
                <Text style={[styles.taskAssignee, { color: theme.tabIconDefault }]}>{task.assignee}</Text>
                <View style={styles.taskPoints}>
                  <MaterialCommunityIcons name="star" size={12} color={theme.tabIconSelected} />
                  <Text style={[styles.taskPointsText, { color: theme.tabIconSelected }]}>{task.points} pts</Text>
                </View>
              </View>
              <Text style={[styles.taskDueDate, { color: theme.tabIconDefault }]}>Vence em: {formatDate(task.due_date)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.deleteButton}>
              <MaterialCommunityIcons name="delete" size={20} color={theme.tabIconDefault} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.newTaskForm}>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', color: theme.text }]}
          placeholder="Título da tarefa"
          placeholderTextColor={theme.tabIconDefault}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', color: theme.text }]}
          placeholder="Responsável"
          placeholderTextColor={theme.tabIconDefault}
          value={newTaskAssignee}
          onChangeText={setNewTaskAssignee}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', color: theme.text }]}
          placeholder="Pontos"
          placeholderTextColor={theme.tabIconDefault}
          value={newTaskPoints}
          onChangeText={setNewTaskPoints}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.tabIconDefault }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calendar" color={theme.tabIconDefault} size={18} />
          <Text style={[styles.secondaryButtonText, { color: theme.tabIconDefault }]}>
            {newTaskDueDate ? formatDate(newTaskDueDate.toISOString()) : 'Selecionar Data'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={newTaskDueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        <TouchableOpacity style={[styles.addTaskButton, { backgroundColor: theme.tint }]} onPress={handleAddTask}>
          <MaterialCommunityIcons name="plus" color={isDark ? '#FFFFFF' : '#1E1E1E'} size={18} />
          <Text style={[styles.addTaskText, { color: isDark ? '#FFFFFF' : '#1E1E1E' }]}>Adicionar Tarefa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tasksCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskProgress: {
    marginBottom: 20,
  },
  taskProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tasksList: {
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskAssignee: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskPointsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  taskDueDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  newTaskForm: {
    marginBottom: 20,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  addTaskButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 14,
  },
  addTaskText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
});