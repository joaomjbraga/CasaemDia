import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { handleSupabaseError, supabase } from '../lib/supabase';

interface AddTaskFormProps {
  userId: string | null;
  onClose: () => void;
  onTaskAdded: () => void;
  onToggleDatePicker?: (isVisible: boolean) => void;
}

const AddTaskForm = ({ userId, onClose, onTaskAdded, onToggleDatePicker }: AddTaskFormProps) => {
  const colors = Colors.light;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState(new Date());
  const [type, setType] = useState('task');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para atualizar o estado do DateTimePicker e notificar o componente pai
  const toggleDatePicker = (visible: boolean) => {
    setShowDatePicker(visible);
    if (onToggleDatePicker) {
      onToggleDatePicker(visible || showTimePicker);
    }
  };

  const toggleTimePicker = (visible: boolean) => {
    setShowTimePicker(visible);
    if (onToggleDatePicker) {
      onToggleDatePicker(visible || showDatePicker);
    }
  };

  // Função para lidar com a seleção de data
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      toggleDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      // Manter a hora atual, apenas alterar a data
      const newDate = new Date(eventTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setEventTime(newDate);

      // Se estiver no Android, mostrar o time picker após selecionar a data
      if (Platform.OS === 'android') {
        setTimeout(() => {
          toggleTimePicker(true);
        }, 100);
      }
    } else if (event.type === 'dismissed') {
      toggleDatePicker(false);
    }
  };

  // Função para lidar com a seleção de horário
  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      toggleTimePicker(false);
    }

    if (event.type === 'set' && selectedTime) {
      // Manter a data atual, apenas alterar a hora
      const newTime = new Date(eventTime);
      newTime.setHours(selectedTime.getHours());
      newTime.setMinutes(selectedTime.getMinutes());
      setEventTime(newTime);
    } else if (event.type === 'dismissed') {
      toggleTimePicker(false);
    }
  };

  // Função para salvar o evento no Supabase
  const handleSaveEvent = async () => {
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Erro', 'Título é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from('events').insert({
        user_id: userId,
        title: title.trim(),
        event_time: eventTime.toISOString(),
        type: type,
        description: description.trim() || null,
      });

      if (error) {
        throw new Error('Erro ao salvar compromisso: ' + error.message);
      }

      Alert.alert('Sucesso', 'Compromisso adicionado com sucesso!');
      onTaskAdded();
      setTitle('');
      setDescription('');
      setEventTime(new Date());
      setType('task');
      onClose();
    } catch (err: unknown) {
      const errorMessage = handleSupabaseError(err, 'handleSaveEvent');
      setError(errorMessage);
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Opções de tipo de compromisso
  const typeOptions = [
    { value: 'task', label: 'Tarefa Doméstica', icon: 'home-variant' },
    { value: 'meeting', label: 'Reunião/Evento', icon: 'calendar-account' },
    { value: 'shopping', label: 'Compras', icon: 'cart' },
    { value: 'expense', label: 'Pagamento/Conta', icon: 'currency-usd' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.formContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Agendar Compromisso da Casa
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Título do Compromisso</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Limpar a cozinha, Jardinagem..."
            placeholderTextColor={colors.mutedText}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Descrição do Compromisso</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalhes, observações ou instruções especiais..."
            placeholderTextColor={colors.mutedText}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Tipo de Compromisso</Text>
          <View style={styles.typeContainer}>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeOption,
                  {
                    borderColor: type === option.value ? colors.primary : colors.border,
                    backgroundColor: type === option.value ? colors.primary + '10' : 'transparent',
                  },
                ]}
                onPress={() => setType(option.value)}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={20}
                  color={type === option.value ? colors.primary : colors.mutedText}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: type === option.value ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Data e Hora</Text>

          {/* Botão para selecionar data */}
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border, marginBottom: 8 }]}
            onPress={() => toggleDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={colors.primary}
              style={styles.dateIcon}
            />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {eventTime.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {/* Botão para selecionar horário */}
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border }]}
            onPress={() => toggleTimePicker(true)}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={colors.primary}
              style={styles.dateIcon}
            />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {eventTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>

          {/* DatePicker para data */}
          {showDatePicker && (
            <DateTimePicker
              value={eventTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* TimePicker para horário */}
          {showTimePicker && (
            <DateTimePicker
              value={eventTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              is24Hour={true}
            />
          )}
        </View>
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSaveEvent}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="content-save"
            size={18}
            color={colors.textWhite}
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonText, { color: colors.textWhite }]}>
            {loading ? 'Salvando...' : 'Salvar Compromisso'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.border }]}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    width: '100%',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    width: '100%',
    minHeight: 80,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    flex: 1,
  },
  typeContainer: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    width: '100%',
  },
  typeText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 30
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AddTaskForm;