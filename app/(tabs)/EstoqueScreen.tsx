import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface InventoryItem {
  id: number;
  name: string;
  category: 'alimentos' | 'limpeza' | 'higiene' | 'outros';
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  expiration_date: string | null;
  location: string | null;
  notes: string | null;
  needs_restock: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const CATEGORIES = [
  { label: 'Alimentos', value: 'alimentos', icon: 'restaurant' },
  { label: 'Limpeza', value: 'limpeza', icon: 'sparkles' },
  { label: 'Higiene', value: 'higiene', icon: 'water' },
  { label: 'Outros', value: 'outros', icon: 'cube' },
];

const UNITS = ['unidade', 'kg', 'g', 'litro', 'ml', 'pacote', 'caixa', 'tubo'];

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showOnlyRestock, setShowOnlyRestock] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Form states
  const [form, setForm] = useState({
    name: '',
    category: 'alimentos' as InventoryItem['category'],
    current_quantity: '',
    minimum_quantity: '',
    unit: 'unidade',
    expiration_date: null as Date | null,
    location: '',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadInventory();

    // Monitorar estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento de autenticação:', event, 'Sessão:', session);
      if (!session) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, showOnlyRestock, searchText]);

  const loadInventory = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Usuário autenticado:', user?.id);
      if (authError || !user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setItems(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar estoque:', error);
      Alert.alert('Erro', 'Não foi possível carregar o estoque');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'todos') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (showOnlyRestock) {
      filtered = filtered.filter(item => item.needs_restock);
    }

    if (searchText) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredItems(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'alimentos',
      current_quantity: '',
      minimum_quantity: '',
      unit: 'unidade',
      expiration_date: null,
      location: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        category: item.category,
        current_quantity: item.current_quantity.toString(),
        minimum_quantity: item.minimum_quantity.toString(),
        unit: item.unit,
        expiration_date: item.expiration_date ? new Date(item.expiration_date) : null,
        location: item.location || '',
        notes: item.notes || '',
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const saveItem = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Usuário autenticado:', user?.id);
      if (authError || !user) {
        console.error('Erro de autenticação:', authError);
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }

      if (!form.name.trim()) {
        Alert.alert('Erro', 'Nome do item é obrigatório');
        return;
      }

      const currentQuantity = parseInt(form.current_quantity) || 0;
      const minimumQuantity = parseInt(form.minimum_quantity) || 1;
      const itemData = {
        user_id: user.id,
        name: form.name.trim(),
        category: form.category,
        current_quantity: currentQuantity,
        minimum_quantity: minimumQuantity,
        unit: form.unit,
        expiration_date: form.expiration_date ? form.expiration_date.toISOString().split('T')[0] : null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Atualização otimista
      let previousItems = [...items];
      let tempId: number | null = null;
      if (editingItem) {
        setItems(items.map(item =>
          item.id === editingItem.id
            ? { ...item, ...itemData, id: editingItem.id, needs_restock: currentQuantity <= minimumQuantity }
            : item
        ));
      } else {
        tempId = Date.now(); // Usar timestamp como ID temporário
        setItems([...items, { ...itemData, id: tempId, needs_restock: currentQuantity <= minimumQuantity }]);
      }

      let error;
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update(itemData)
          .eq('id', editingItem.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError, data } = await supabase
          .from('inventory')
          .insert([itemData])
          .select()
          .single();
        error = insertError;
        if (data && tempId) {
          // Atualizar o ID temporário com o ID real retornado pelo Supabase
          setItems(items =>
            items.map(item =>
              item.id === tempId ? { ...item, id: data.id, needs_restock: data.needs_restock } : item
            )
          );
        }
      }

      if (error) {
        // Reverter a atualização otimista
        setItems(previousItems);
        console.error('Erro do Supabase:', error);
        throw error;
      }

      // Recarregar os dados para sincronizar needs_restock
      await loadInventory();

      closeModal();
      Alert.alert(
        'Sucesso',
        editingItem ? 'Item atualizado com sucesso!' : 'Item adicionado com sucesso!'
      );
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      Alert.alert('Erro', `Não foi possível salvar o item: ${error.message}`);
    }
  };

  const deleteItem = async (id: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Atualização otimista
              const previousItems = [...items];
              setItems(items.filter(item => item.id !== id));

              const { error } = await supabase
                .from('inventory')
                .delete()
                .eq('id', id)
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

              if (error) {
                // Reverter a atualização otimista
                setItems(previousItems);
                throw error;
              }

              Alert.alert('Sucesso', 'Item excluído com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir item:', error);
              Alert.alert('Erro', 'Não foi possível excluir o item');
            }
          },
        },
      ]
    );
  };

  const updateQuantity = async (id: number, newQuantity: number) => {
    try {
      // Atualização otimista
      const previousItems = [...items];
      const item = items.find(item => item.id === id);
      if (!item) return;

      setItems(items.map(item =>
        item.id === id
          ? {
            ...item,
            current_quantity: Math.max(0, newQuantity),
            needs_restock: Math.max(0, newQuantity) <= item.minimum_quantity,
            updated_at: new Date().toISOString(),
          }
          : item
      ));

      const { error } = await supabase
        .from('inventory')
        .update({
          current_quantity: Math.max(0, newQuantity),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        // Reverter a atualização otimista
        setItems(previousItems);
        throw error;
      }

      // Recarregar os dados para sincronizar needs_restock
      await loadInventory();
    } catch (error: any) {
      console.error('Erro ao atualizar quantidade:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a quantidade');
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : 'cube';
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const expiringSoon = isExpiringSoon(item.expiration_date);

    return (
      <View style={[
        styles.itemCard,
        item.needs_restock && styles.restockCard,
        expiringSoon && styles.expiringCard
      ]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={24}
              color={Colors.light.primary}
              style={styles.categoryIcon}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemLocation}>
                {CATEGORIES.find(c => c.value === item.category)?.label}
                {item.location && ` • ${item.location}`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => openModal(item)}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, item.current_quantity - 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={20} color={Colors.light.primary} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>
            {item.current_quantity} {item.unit}
          </Text>

          <TouchableOpacity
            onPress={() => updateQuantity(item.id, item.current_quantity + 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {item.needs_restock && (
          <View style={styles.alertContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.light.warning} />
            <Text style={styles.alertText}>
              Estoque baixo (mín: {item.minimum_quantity} {item.unit})
            </Text>
          </View>
        )}

        {expiringSoon && (
          <View style={styles.alertContainer}>
            <Ionicons name="time" size={16} color={Colors.light.danger} />
            <Text style={styles.alertText}>
              Vence em breve: {new Date(item.expiration_date!).toLocaleDateString()}
            </Text>
          </View>
        )}

        {item.notes && (
          <Text style={styles.itemNotes}>{item.notes}</Text>
        )}

        <TouchableOpacity
          onPress={() => deleteItem(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Controle de Estoque</Text>
        <TouchableOpacity
          onPress={() => openModal()}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.light.textWhite} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar itens..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <TouchableOpacity
          onPress={() => setSelectedCategory('todos')}
          style={[styles.filterChip, selectedCategory === 'todos' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, selectedCategory === 'todos' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>

        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.value}
            onPress={() => setSelectedCategory(category.value)}
            style={[styles.filterChip, selectedCategory === category.value && styles.filterChipActive]}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.value ? Colors.light.textWhite : Colors.light.primary}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, selectedCategory === category.value && styles.filterTextActive]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setShowOnlyRestock(!showOnlyRestock)}
          style={[styles.filterChip, showOnlyRestock && styles.restockFilterActive]}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={showOnlyRestock ? Colors.light.textWhite : Colors.light.warning}
            style={styles.filterIcon}
          />
          <Text style={[styles.filterText, showOnlyRestock && styles.filterTextActive]}>
            Repor
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={Colors.light.mutedText} />
            <Text style={styles.emptyText}>Nenhum item encontrado</Text>
            <Text style={styles.emptySubtext}>
              {searchText || selectedCategory !== 'todos' || showOnlyRestock
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione o primeiro item ao seu estoque'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Item *</Text>
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={text => setForm({ ...form, name: text })}
                placeholder="Ex: Arroz, Detergente, etc."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoria</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.category}
                  onValueChange={value => setForm({ ...form, category: value })}
                  style={styles.picker}
                >
                  {CATEGORIES.map(cat => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Quantidade Atual</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.current_quantity}
                  onChangeText={text => setForm({ ...form, current_quantity: text.replace(/[^0-9]/g, '') })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
                <Text style={styles.inputLabel}>Quantidade Mínima</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.minimum_quantity}
                  onChangeText={text => setForm({ ...form, minimum_quantity: text.replace(/[^0-9]/g, '') })}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unidade</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.unit}
                  onValueChange={value => setForm({ ...form, unit: value })}
                  style={styles.picker}
                >
                  {UNITS.map(unit => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data de Validade</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {form.expiration_date ? form.expiration_date.toLocaleDateString() : 'Selecionar data'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.light.mutedText} />
              </TouchableOpacity>

              {form.expiration_date && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setForm({ ...form, expiration_date: null })}
                >
                  <Text style={styles.clearDateText}>Remover data</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Local de Armazenamento</Text>
              <TextInput
                style={styles.textInput}
                value={form.location}
                onChangeText={text => setForm({ ...form, location: text })}
                placeholder="Ex: Despensa, Geladeira, Banheiro"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Observações</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.notes}
                onChangeText={text => setForm({ ...form, notes: text })}
                placeholder="Observações adicionais..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={form.expiration_date || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setForm({ ...form, expiration_date: selectedDate });
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  restockFilterActive: {
    backgroundColor: Colors.light.warning,
    borderColor: Colors.light.warning,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.light.textWhite,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restockCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.warning,
  },
  expiringCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.danger,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: Colors.light.mutedText,
  },
  editButton: {
    padding: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    backgroundColor: Colors.light.backgroundSecondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginHorizontal: 24,
    minWidth: 80,
    textAlign: 'center',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: Colors.light.mutedText,
    marginLeft: 8,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 14,
    color: Colors.light.mutedText,
    fontStyle: 'italic',
    marginTop: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.mutedText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.mutedText,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: Colors.light.text,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 10,
  },
  dateButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: Colors.light.danger,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.light.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textWhite,
  },
});