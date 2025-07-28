import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

interface ShoppingItem {
  id: number;
  name: string;
  done: boolean;
}

interface Theme {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');

  const colorScheme = useColorScheme() as 'light' | 'dark';
  const isDark = colorScheme === 'dark';

  const theme: Theme = {
    text: isDark ? '#FFFFFF' : '#010101',
    background: isDark ? '#1E1E1E' : '#F5F5F5',
    tint: isDark ? '#C9F31D' : '#3E8E7E',
    tabIconDefault: isDark ? '#A0A0A0' : '#6B6B6B',
    tabIconSelected: isDark ? '#9AB821' : '#2D6B5F',
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do item.');
      return;
    }
    setItems([
      ...items,
      {
        id: Date.now(),
        name: newItemName.trim(),
        done: false,
      },
    ]);
    setNewItemName('');
  };

  const handleToggleItem = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const handleDeleteItem = (id: number) => {
    Alert.alert(
      'Excluir Item',
      'Tem certeza que deseja excluir este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: () => setItems(items.filter((item) => item.id !== id)),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <MaterialCommunityIcons name="cart-plus" color={theme.tint} size={16} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Lista de Compras</Text>
        </View>
      </View>

      <View style={styles.newItemForm}>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', color: theme.text }]}
          placeholder="Adicionar item"
          placeholderTextColor={theme.tabIconDefault}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity
          style={[styles.addItemButton, { backgroundColor: theme.tint }]}
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={18} />
          <Text style={[styles.addItemText, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {items.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.tabIconDefault }]}>
            Nenhum item na lista de compras.
          </Text>
        )}
        {items.map((item) => (
          <View key={item.id} style={[styles.item, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <TouchableOpacity
              onPress={() => handleToggleItem(item.id)}
              style={[styles.checkbox, { borderColor: item.done ? theme.tint : theme.tabIconDefault, backgroundColor: item.done ? theme.tint : 'transparent' }]}
            >
              {item.done && (
                <MaterialCommunityIcons name="check" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={14} />
              )}
            </TouchableOpacity>
            <Text
              style={[styles.itemText, { textDecorationLine: item.done ? 'line-through' : 'none', color: item.done ? theme.tabIconDefault : theme.text }]}
            >
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteButton}>
              <MaterialCommunityIcons name="delete" size={20} color={theme.tabIconDefault} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  newItemForm: {
    marginBottom: 20,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addItemText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  itemsList: {
    marginBottom: 20,
  },
  item: {
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
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});