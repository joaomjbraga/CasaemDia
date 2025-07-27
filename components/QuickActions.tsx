import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface QuickActionsProps {
  theme: any;
  isDark: boolean;
}

export default function QuickActions({ theme, isDark }: QuickActionsProps) {
  return (
    <View style={[styles.quickActions, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Ações Rápidas</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: isDark ? '#F4CE1420' : '#3E8E7E20' }]}>
          <MaterialCommunityIcons name="cart-plus" size={24} color={theme.tint} />
          <Text style={[styles.quickActionText, { color: theme.text }]}>Lista de Compras</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#3b82f620' }]}>
          <MaterialCommunityIcons name="target" size={24} color="#3b82f6" />
          <Text style={[styles.quickActionText, { color: theme.text }]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#FF8C4220' }]}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#FF8C42" />
          <Text style={[styles.quickActionText, { color: theme.text }]}>Relatórios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#8E44AD20' }]}>
          <MaterialCommunityIcons name="cog" size={24} color="#8E44AD" />
          <Text style={[styles.quickActionText, { color: theme.text }]}>Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});