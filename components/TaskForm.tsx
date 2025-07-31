import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { useFamilyMembers } from '../contexts/FamilyMembersContext';

interface TaskFormProps {
  addTask?: (title: string, assignee_id: number, points: number, due_date: string | null) => Promise<void>;
}

const defaultAddTask = async (title: string, assignee_id: number, points: number, due_date: string | null) => {
  console.log('TaskForm: Adding task (default):', { title, assignee_id, points, due_date });
  Alert.alert('Sucesso', 'Tarefa adicionada com sucesso!');
};

export default function TaskForm({ addTask = defaultAddTask }: TaskFormProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | null>(null);
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { familyMembers, loading, fetchFamilyMembers } = useFamilyMembers();

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
    <View style={[styles.taskForm, { backgroundColor: Colors.light.cardBackground }]}>
      <View style={styles.formHeader}>
        <MaterialCommunityIcons name="plus-circle" size={26} color={Colors.light.primary} />
        <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>Nova Tarefa</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: Colors.light.text }]}>Título *</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: Colors.light.backgroundSecondary + '90',
            color: Colors.light.text,
            borderColor: Colors.light.borderLight,
          }]}
          placeholder="Ex: Lavar a louça"
          placeholderTextColor={Colors.light.mutedText}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: Colors.light.text }]}>Responsável *</Text>
        <View style={[styles.pickerContainer, {
          backgroundColor: Colors.light.backgroundSecondary + '90',
          borderColor: Colors.light.borderLight,
        }]}>
          <Picker
            selectedValue={newTaskAssigneeId}
            onValueChange={(itemValue) => setNewTaskAssigneeId(itemValue)}
            style={[styles.picker, { color: Colors.light.text }]}
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
        <Text style={[styles.inputLabel, { color: Colors.light.text }]}>Pontos *</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: Colors.light.backgroundSecondary + '90',
            color: Colors.light.text,
            borderColor: Colors.light.borderLight,
          }]}
          placeholder="Ex: 10"
          placeholderTextColor={Colors.light.mutedText}
          value={newTaskPoints}
          onChangeText={setNewTaskPoints}
          keyboardType="numeric"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: Colors.light.text }]}>Data limite (opcional)</Text>
        <TouchableOpacity
          style={[styles.dateButton, {
            backgroundColor: Colors.light.backgroundSecondary + '90',
            borderColor: Colors.light.borderLight,
          }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.6}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="calendar" color={Colors.light.primary} size={22} />
          <Text style={[styles.dateButtonText, { color: newTaskDueDate ? Colors.light.text : Colors.light.mutedText }]}>
            {newTaskDueDate ? formatDate(newTaskDueDate) : 'Selecionar Data'}
          </Text>
          {newTaskDueDate && (
            <TouchableOpacity onPress={clearDate} style={styles.clearDateButton}>
              <MaterialCommunityIcons name="close" color={Colors.light.mutedText} size={18} />
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
          style={[styles.addTaskButton, {
            backgroundColor: isSubmitting ? Colors.light.mutedText : Colors.light.primary,
            opacity: isSubmitting ? 0.6 : 1,
          }]}
          onPress={handleAddTask}
          activeOpacity={0.6}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons
            name={isSubmitting ? "loading" : "check"}
            color={Colors.light.textWhite}
            size={22}
          />
          <Text style={[styles.addTaskText, { color: Colors.light.textWhite }]}>
            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.refreshButton, {
            borderColor: Colors.light.border,
            backgroundColor: Colors.light.cardBackground,
          }]}
          onPress={fetchFamilyMembers}
          activeOpacity={0.6}
          disabled={loading || isSubmitting}
        >
          <MaterialCommunityIcons name="refresh" color={Colors.light.primary} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskForm: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    opacity: 0.9,
  },
  input: {
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  pickerContainer: {
    borderRadius: 14,
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
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  clearDateButton: {
    padding: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  addTaskButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addTaskText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});