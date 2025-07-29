import { useTheme } from '@/contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

interface ShoppingItem {
  id: number;
  name: string;
  done: boolean;
}

export default function ShoppingList() {
  const { isDark } = useTheme();

  const themeColors = isDark
    ? {
        gradient: ['#000', '#000'] as const,
        text: '#E8ECEF',
        accent: '#151515',
        highlight: '#77ac74',
        secondary: '#c0c5b0',
        btn: 'black'
      }
    : {
        gradient: ['#fffffff8', '#fffffff8'] as const,
        text: '#1C2526',
        accent: '#F1F5F9',
        highlight: '#3E8E7E',
        secondary: '#374f32',
        btn: 'white'
      };

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Função para buscar itens
  const fetchItems = useCallback(async () => {
    console.log('Iniciando fetchItems...');
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('Erro de autenticação:', userError?.message);
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      const userId = userData.user.id;
      console.log('Usuário autenticado:', userId);

      const { data, error } = await supabase
        .from('shopping_list')
        .select('id, title, done')
        .eq('user_id', userId);
      if (error) {
        console.error('Erro na consulta Supabase:', error.message);
        throw error;
      }
      console.log('Dados recebidos do Supabase:', data);

      const mappedItems: ShoppingItem[] = data.map((item) => ({
        id: item.id,
        name: item.title,
        done: item.done,
      }));
      setItems(mappedItems);
      try {
        await AsyncStorage.setItem('@shopping_list', JSON.stringify(mappedItems));
        console.log('Cache atualizado com sucesso');
      } catch (cacheErr) {
        console.error('Erro ao salvar no cache:', cacheErr);
      }
    } catch (err: any) {
      console.error('Erro geral em fetchItems:', err);
      setError(err.message || 'Falha ao carregar a lista. Usando cache local.');
      try {
        const cached = await AsyncStorage.getItem('@shopping_list');
        if (cached) {
          const cachedItems = JSON.parse(cached);
          setItems(cachedItems);
          console.log('Itens carregados do cache:', cachedItems);
        } else {
          console.log('Nenhum dado no cache');
        }
      } catch (cacheErr) {
        console.error('Erro ao carregar do cache:', cacheErr);
      }
      if (err.message.includes('não autenticado')) {
        Alert.alert(
          'Erro de Autenticação',
          'Você precisa fazer login para acessar a lista.',
          [{ text: 'Fazer Login', onPress: () => router.push('/login') }]
        );
      }
    } finally {
      setLoading(false);
      console.log('fetchItems concluído');
    }
  }, []);

  // Configurar real-time
  useEffect(() => {
    console.log('Configurando subscrição em tempo real...');
    fetchItems();

    const subscription = supabase
      .channel('shopping_list_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list' },
        (payload) => {
          console.log('Evento de mudança detectado:', payload);
          fetchItems();
        }
      )
      .subscribe((status) => {
        console.log('Status da subscrição:', status);
      });

    return () => {
      console.log('Removendo subscrição em tempo real');
      supabase.removeChannel(subscription);
    };
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Preencha o nome do item.');
      return;
    }
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('Erro de autenticação ao adicionar:', userError?.message);
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      const newItem = {
        title: newItemName.trim(),
        user_id: userData.user.id,
        done: false,
      };

      const { error } = await supabase.from('shopping_list').insert(newItem);
      if (error) {
        console.error('Erro ao inserir item:', error.message);
        throw error;
      }
      console.log('Item adicionado com sucesso:', newItem);
      setNewItemName('');
      await fetchItems();
    } catch (err: any) {
      console.error('Erro ao adicionar item:', err);
      setError(err.message || 'Falha ao adicionar item. Tente novamente.');
      if (err.message.includes('não autenticado')) {
        Alert.alert(
          'Erro de Autenticação',
          'Você precisa fazer login para adicionar itens.',
          [{ text: 'Fazer Login', onPress: () => router.push('/login') }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ done: !item.done })
        .eq('id', id);
      if (error) {
        console.error('Erro ao atualizar item:', error.message);
        throw error;
      }
      console.log('Item atualizado:', { id, done: !item.done });
      await fetchItems();
    } catch (err: any) {
      console.error('Erro ao atualizar item:', err);
      setError(err.message || 'Falha ao atualizar item. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('shopping_list').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir item:', error.message);
        throw error;
      }
      console.log('Item excluído:', id);
      await fetchItems();
    } catch (err: any) {
      console.error('Erro ao excluir item:', err);
      setError(err.message || 'Falha ao excluir item. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompleted = async () => {
    Alert.alert(
      'Limpar Concluídos',
      'Deseja remover todos os itens concluídos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('shopping_list')
                .delete()
                .eq('done', true);
              if (error) {
                console.error('Erro ao limpar itens concluídos:', error.message);
                throw error;
              }
              console.log('Itens concluídos limpos');
              await fetchItems();
            } catch (err: any) {
              console.error('Erro ao limpar itens concluídos:', err);
              setError(err.message || 'Falha ao limpar itens concluídos. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setItems((prevItems) =>
      [...prevItems].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return newSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      })
    );
  };

  const handleCalculatorPress = (value: string) => {
    if (value === 'C') {
      setCalcDisplay('0');
      return;
    }
    if (value === '=') {
      try {
        const result = eval(calcDisplay);
        setCalcDisplay(result.toString());
      } catch {
        setCalcDisplay('Erro');
      }
      return;
    }
    setCalcDisplay((prev) => {
      if (prev === '0' || prev === 'Erro') {
        return value;
      }
      return prev + value;
    });
  };

  const filteredItems = filterName
    ? items.filter((item) => item.name.toLowerCase().includes(filterName.toLowerCase()))
    : items;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient colors={themeColors.gradient} style={styles.gradient}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={themeColors.highlight} />
          </View>
        )}
        {error && (
          <Animated.View entering={FadeInDown} style={[styles.errorContainer, { backgroundColor: isDark ? '#EF5350' : '#FFEBEE' }]}>
            <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#D32F2F' }]}>{error}</Text>
          </Animated.View>
        )}
        <View style={styles.header}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: themeColors.accent }]}>
                <MaterialCommunityIcons name="cart-outline" color={themeColors.highlight} size={18} />
              </View>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Lista de Compras</Text>
            </View>
            {items.some((item) => item.done) && (
              <Animated.View entering={FadeIn}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearCompleted}
                  accessibilityLabel="Limpar itens concluídos"
                >
                  <MaterialCommunityIcons name="delete-sweep-outline" size={22} color={themeColors.secondary} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>

        <View style={styles.newItemForm}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.accent, color: themeColors.text, marginBottom: 14 }]}
            placeholder="Adicionar item"
            placeholderTextColor={themeColors.secondary}
            value={newItemName}
            onChangeText={setNewItemName}
            accessibilityLabel="Nome do item"
          />
          <View style={styles.filterContainer}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: themeColors.accent, color: themeColors.text, marginBottom: 14 }]}
              placeholder="Filtrar itens"
              placeholderTextColor={themeColors.secondary}
              value={filterName}
              onChangeText={setFilterName}
              accessibilityLabel="Filtrar por nome do item"
            />
            {filterName && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setFilterName('')}
                accessibilityLabel="Limpar filtro"
              >
                <MaterialCommunityIcons name="close" size={18} color={themeColors.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: themeColors.accent }]}
              onPress={handleSort}
              accessibilityLabel={`Ordenar por nome ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
            >
              <Text style={[styles.sortButtonText, { color: themeColors.text }]}>
                Nome {sortOrder === 'asc' ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
          </View>
          <Animated.View entering={FadeIn}>
            <TouchableOpacity
              style={[styles.addItemButton, { backgroundColor: themeColors.highlight }]}
              onPress={handleAddItem}
              activeOpacity={0.8}
              accessibilityLabel="Adicionar item à lista"
            >
              <MaterialCommunityIcons name="plus" color={themeColors.btn} size={18} />
              <Text style={[styles.addItemText, { color: themeColors.btn }]}>Adicionar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 && !loading && (
            <Text style={[styles.emptyText, { color: themeColors.secondary }]}>
              Sua lista está vazia.
            </Text>
          )}
          {filteredItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 50)}
              style={[styles.item, { backgroundColor: themeColors.accent }]}
            >
              <TouchableOpacity
                onPress={() => handleToggleItem(item.id)}
                style={[styles.checkbox, { borderColor: item.done ? themeColors.highlight : themeColors.text, backgroundColor: item.done ? themeColors.highlight : 'transparent' }]}
                accessibilityLabel={item.done ? `Desmarcar ${item.name}` : `Marcar ${item.name} como concluído`}
              >
                {item.done && (
                  <MaterialCommunityIcons name="check" color={themeColors.text} size={14} />
                )}
              </TouchableOpacity>
              <Text
                style={[styles.itemText, { textDecorationLine: item.done ? 'line-through' : 'none', color: item.done ? themeColors.secondary : themeColors.text }]}
              >
                {item.name}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id)}
                style={styles.deleteButton}
                accessibilityLabel={`Excluir ${item.name}`}
              >
                <MaterialCommunityIcons name="close" size={18} color={themeColors.secondary} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: themeColors.highlight }]}
          onPress={() => setCalculatorVisible(true)}
          accessibilityLabel="Abrir calculadora"
        >
          <MaterialCommunityIcons name="calculator" size={24} color={themeColors.btn} />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={calculatorVisible}
          onRequestClose={() => setCalculatorVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.accent }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Calculadora</Text>
              <View style={[styles.calcDisplay, { backgroundColor: themeColors.accent, borderColor: themeColors.secondary }]}>
                <Text style={[styles.calcDisplayText, { color: themeColors.text }]}>{calcDisplay}</Text>
              </View>
              <View style={styles.calcButtons}>
                {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+', '='].map((btn) => (
                  <TouchableOpacity
                    key={btn}
                    style={[styles.calcButton, { backgroundColor: btn === '=' ? themeColors.highlight : themeColors.secondary }]}
                    onPress={() => handleCalculatorPress(btn)}
                    accessibilityLabel={`Botão ${btn === 'C' ? 'limpar' : btn === '=' ? 'calcular' : btn}`}
                  >
                    <Text style={[styles.calcButtonText, { color: themeColors.btn }]}>{btn}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.secondary }]}
                onPress={() => setCalculatorVisible(false)}
                accessibilityLabel="Fechar calculadora"
              >
                <Text style={[styles.modalButtonText, { color: themeColors.btn }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clearButton: {
    padding: 8,
  },
  newItemForm: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFilterButton: {
    padding: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  addItemText: {
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemsListContent: {
    paddingBottom: 80,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
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
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.2,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  calcDisplay: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  calcDisplayText: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'right',
  },
  calcButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  calcButton: {
    width: '22%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});