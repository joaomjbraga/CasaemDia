// src/app/(tabs)/shoppinglist.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface ShoppingItem {
  id: number;
  name: string;
  done: boolean;
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuário não autenticado.');

      const userId = userData.user.id;
      const { data, error } = await supabase
        .from('shopping_list')
        .select('id, title, done')
        .eq('user_id', userId);
      if (error) throw error;

      const mappedItems: ShoppingItem[] = data.map((item) => ({
        id: item.id,
        name: item.title,
        done: item.done,
      }));
      setItems(mappedItems);
      await AsyncStorage.setItem('@shopping_list', JSON.stringify(mappedItems));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar. Usando cache.');
      const cached = await AsyncStorage.getItem('@shopping_list');
      if (cached) setItems(JSON.parse(cached));
      if (err.message.includes('não autenticado')) {
        Alert.alert('Autenticação', 'Faça login para acessar.', [
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const subscription = supabase
      .channel('shopping_list_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list' },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o item.');
      return;
    }
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuário não autenticado.');

      const newItem = {
        title: newItemName.trim(),
        user_id: userData.user.id,
        done: false,
      };
      const { error } = await supabase.from('shopping_list').insert(newItem);
      if (error) throw error;
      setNewItemName('');
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('não autenticado')) {
        Alert.alert('Autenticação', 'Faça login para adicionar itens.', [
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
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
      if (error) throw error;
      await fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    Alert.alert(
      'Remover Item',
      'Tem certeza que deseja remover este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('shopping_list').delete().eq('id', id);
              if (error) throw error;
              await fetchItems();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert('Limpar Concluídos', 'Remover todos os itens concluídos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        onPress: async () => {
          setLoading(true);
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) throw new Error('Usuário não autenticado.');

            const { error } = await supabase
              .from('shopping_list')
              .delete()
              .eq('done', true)
              .eq('user_id', userData.user.id);
            if (error) throw error;
            await fetchItems();
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setItems((prev) =>
      [...prev].sort((a, b) =>
        newOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      )
    );
  };

  const getItemIcon = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes('fruta') || name.includes('banana') || name.includes('maçã') || name.includes('laranja')) return 'fruit-grapes';
    if (name.includes('verdura') || name.includes('alface') || name.includes('tomate') || name.includes('cebola')) return 'carrot';
    if (name.includes('carne') || name.includes('frango') || name.includes('peixe')) return 'food-drumstick';
    if (name.includes('leite') || name.includes('queijo') || name.includes('iogurte')) return 'cow';
    if (name.includes('pão') || name.includes('biscoito') || name.includes('bolo')) return 'bread-slice';
    if (name.includes('limpeza') || name.includes('detergente') || name.includes('sabão')) return 'spray-bottle';
    if (name.includes('remédio') || name.includes('medicamento')) return 'pill';
    return 'basket';
  };

  const getStats = () => {
    const total = items.length;
    const completed = items.filter(item => item.done).length;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, completionPercentage };
  };

  const filteredItems = filterName
    ? items.filter((item) => item.name.toLowerCase().includes(filterName.toLowerCase()))
    : items;

  const stats = getStats();

  // Exibir loading apenas se não há itens carregados
  if (loading && items.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.light.background }]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Carregando lista...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {loading && items.length > 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
          </View>
        </View>
      )}

      {/* Header com fundo roxo */}
      <View style={[styles.header, { backgroundColor: Colors.light.primary }]}>
        <StatusBar barStyle={'default'} backgroundColor={Colors.light.tint} />
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.light.textWhite }]}>
            <MaterialCommunityIcons
              name="cart"
              color={Colors.light.primary}
              size={28}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: Colors.light.textWhite }]}>
              Lista de Compras
            </Text>
            <Text style={[styles.headerSubtitle, { color: Colors.light.textWhite }]}>
              {stats.total} {stats.total === 1 ? 'item' : 'itens'} • {stats.completed} concluído{stats.completed !== 1 ? 's' : ''}
            </Text>
          </View>
          {items.some((i) => i.done) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCompleted}
            >
              <MaterialCommunityIcons name="delete-sweep" size={24} color={Colors.light.textWhite} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulário de Adição */}
        <View style={[styles.formCard, { backgroundColor: Colors.light.cardBackground }]}>
          <Text style={[styles.formTitle, { color: Colors.light.text }]}>
            Adicionar Item
          </Text>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: Colors.light.background }]}>
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={Colors.light.mutedText}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: Colors.light.text }]}
                placeholder="Digite o nome do item..."
                placeholderTextColor={Colors.light.mutedText}
                value={newItemName}
                onChangeText={setNewItemName}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: Colors.light.primary,
                  opacity: !newItemName.trim() ? 0.5 : 1
                }
              ]}
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
            >
              <MaterialCommunityIcons name="plus" size={20} color={Colors.light.textWhite} />
              <Text style={[styles.addButtonText, { color: Colors.light.textWhite }]}>
                Adicionar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros e Ordenação */}
        <View style={[styles.filtersCard, { backgroundColor: Colors.light.cardBackground }]}>
          <View style={styles.filtersRow}>
            <View style={[styles.filterInputWrapper, { backgroundColor: Colors.light.background }]}>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={Colors.light.mutedText}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.filterInput, { color: Colors.light.text }]}
                placeholder="Filtrar itens..."
                placeholderTextColor={Colors.light.mutedText}
                value={filterName}
                onChangeText={setFilterName}
              />
              {filterName ? (
                <TouchableOpacity onPress={() => setFilterName('')}>
                  <MaterialCommunityIcons name="close" size={18} color={Colors.light.mutedText} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: Colors.light.background }]}
              onPress={handleSort}
            >
              <MaterialCommunityIcons
                name={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'}
                size={20}
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Itens */}
        <View style={[styles.listCard, { backgroundColor: Colors.light.cardBackground }]}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: Colors.light.text }]}>
              {filterName ? `Resultados (${filteredItems.length})` : 'Meus Itens'}
            </Text>
          </View>

          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.listItem,
                  { borderBottomColor: Colors.light.borderLight },
                  index === filteredItems.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    {
                      borderColor: item.done ? Colors.light.success : Colors.light.borderLight,
                      backgroundColor: item.done ? Colors.light.success : 'transparent',
                    },
                  ]}
                  onPress={() => handleToggleItem(item.id)}
                >
                  {item.done && (
                    <MaterialCommunityIcons
                      name="check"
                      color={Colors.light.textWhite}
                      size={16}
                    />
                  )}
                </TouchableOpacity>

                <View style={[styles.itemIcon, {
                  backgroundColor: item.done
                    ? Colors.light.borderLight
                    : Colors.light.illustrationCyan + '20'
                }]}>
                  <MaterialCommunityIcons
                    name={getItemIcon(item.name)}
                    size={18}
                    color={item.done ? Colors.light.mutedText : Colors.light.illustrationCyan}
                  />
                </View>

                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, {
                    color: item.done ? Colors.light.mutedText : Colors.light.text,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                  }]}>
                    {item.name}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color={Colors.light.danger}
                  />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: Colors.light.borderLight }]}>
                <MaterialCommunityIcons
                  name={filterName ? "magnify" : "cart-plus"}
                  size={48}
                  color={Colors.light.mutedText}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: Colors.light.text }]}>
                {filterName ? "Nenhum item encontrado" : "Lista vazia"}
              </Text>
              <Text style={[styles.emptyDescription, { color: Colors.light.mutedText }]}>
                {filterName
                  ? "Tente usar outros termos de busca"
                  : "Adicione itens à sua lista de compras"
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Exibir erro se houver */}
      {error && (
        <View style={styles.errorToast}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.light.cardBackground,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 1000,
    marginTop: 100,
  },
  loadingIndicator: {
    backgroundColor: Colors.light.cardBackground,
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  clearButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  sortButton: {
    padding: 12,
    borderRadius: 12,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 40,
  },
  listHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorToast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.light.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.light.textWhite,
    fontSize: 14,
    fontWeight: '500',
  },
});