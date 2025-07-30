import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { useFamilyMembers } from '../contexts/FamilyMembersContext';
import { useTheme } from '../contexts/ThemeContext';

interface TaskFormProps {
  addTask?: (title: string, assignee_id: number, points: number, due_date: string | null) => Promise<void>;
}

const defaultAddTask = async (title: string, assignee_id: number, points: number, due_date: string | null) => {
  console.log('TaskForm: Adding task (default):', { title, assignee_id, points, due_date });
  Alert.alert('Sucesso', 'Tarefa adicionada com sucesso!');
};

export default function TaskForm({ addTask = defaultAddTask }: TaskFormProps) {
  const { isDark } = useTheme();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | null>(null);
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { familyMembers, loading, fetchFamilyMembers } = useFamilyMembers();

  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (familyMembers.length > 0) {
      if (!newTaskAssigneeId || !familyMembers.some((member) => member.id === newTaskAssigneeId)) {
        setNewTaskAssigneeId(familyMembers[0].id);
      }
    } else {
      setNewTaskAssigneeId(null);
    }
  }, [familyMembers, newTaskAssigneeId]);

  const handleAddTask = async () => {
    if (isSubmitting) return;

    if (!newTaskTitle.trim()) {
      Alert.alert('Erro', 'Por favor, digite um título para a tarefa.');
      return;
    }

    if (!newTaskAssigneeId) {
      Alert.alert('Erro', 'Por favor, selecione um responsável.');
      return;
    }

    if (!newTaskPoints.trim()) {
      Alert.alert('Erro', 'Por favor, digite os pontos da tarefa.');
      return;
    }

    const points = parseInt(newTaskPoints);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Erro', 'Os pontos devem ser um número maior que zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const dueDate = newTaskDueDate ? newTaskDueDate.toISOString() : null;
      await addTask(newTaskTitle.trim(), newTaskAssigneeId, points, dueDate);

      setNewTaskTitle('');
      setNewTaskPoints('');
      setNewTaskDueDate(null);
      if (familyMembers.length > 0) {
        setNewTaskAssigneeId(familyMembers[0].id);
      }
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao criar a tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewTaskDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const clearDate = () => {
    setNewTaskDueDate(null);
  };

  return (
    <View style={[styles.taskForm, { backgroundColor: colors.background }]}>
      <View style={styles.formHeader}>
        <MaterialCommunityIcons name="plus-circle" size={24} color={colors.tint} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nova Tarefa</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Título *</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            color: colors.text,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }]}
          placeholder="Ex: Lavar a louça"
          placeholderTextColor={colors.tabIconDefault}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Responsável *</Text>
        <View style={[styles.pickerContainer, {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }]}>
          <Picker
            selectedValue={newTaskAssigneeId}
            onValueChange={(itemValue) => setNewTaskAssigneeId(itemValue)}
            style={[styles.picker, { color: colors.text }]}
            enabled={!loading && !isSubmitting}
          >
            {familyMembers.length === 0 ? (
              <Picker.Item label="Nenhum membro disponível" value={null} />
            ) : (
              familyMembers.map((member) => (
                <Picker.Item key={member.id} label={member.name} value={member.id} />
              ))
            )}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Pontos *</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            color: colors.text,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }]}
          placeholder="Ex: 10"
          placeholderTextColor={colors.tabIconDefault}
          value={newTaskPoints}
          onChangeText={setNewTaskPoints}
          keyboardType="numeric"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Data limite (opcional)</Text>
        <TouchableOpacity
          style={[styles.dateButton, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="calendar" color={colors.tint} size={20} />
          <Text style={[styles.dateButtonText, { color: newTaskDueDate ? colors.text : colors.tabIconDefault }]}>
            {newTaskDueDate ? formatDate(newTaskDueDate) : 'Selecionar Data'}
          </Text>
          {newTaskDueDate && (
            <TouchableOpacity onPress={clearDate} style={styles.clearDateButton}>
              <MaterialCommunityIcons name="close" color={colors.tabIconDefault} size={16} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={newTaskDueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.addTaskButton,
            {
              backgroundColor: isSubmitting ? colors.tabIconDefault : colors.tint,
              opacity: isSubmitting ? 0.6 : 1
            }
          ]}
          onPress={handleAddTask}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons
            name={isSubmitting ? "loading" : "check"}
            color={colors.background}
            size={20}
          />
          <Text style={[styles.addTaskText, { color: colors.background }]}>
            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.refreshButton, {
            borderColor: colors.tabIconDefault,
            backgroundColor: 'transparent'
          }]}
          onPress={fetchFamilyMembers}
          activeOpacity={0.7}
          disabled={loading || isSubmitting}
        >
          <MaterialCommunityIcons name="refresh" color={colors.tabIconDefault} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskForm: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  clearDateButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  addTaskButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addTaskText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});