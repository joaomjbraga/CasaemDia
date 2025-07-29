import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConstructionModal from './ConstructionModal';
const { width } = Dimensions.get('window');

interface QuickActionsProps {
  theme: {
    text: string;
    background: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
  };
  isDark: boolean;
}

export default function QuickActions({ theme, isDark }: QuickActionsProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={[styles.quickActions, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Ações Rápidas
      </Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/shoppinglist')}
          style={[
            styles.quickActionItem,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="cart-plus"
              size={28}
              color={theme.tint}
            />
          </View>
          <Text style={[styles.quickActionText, { color: theme.text }]}>
            Lista de Compras
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openModal}
          style={[
            styles.quickActionItem,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="target"
              size={28}
              color={theme.tint}
            />
          </View>
          <Text style={[styles.quickActionText, { color: theme.text }]}>
            Metas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/ExpenseReportScreen')}
          style={[
            styles.quickActionItem,
            { backgroundColor: theme.tabIconSelected + '20' },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="chart-line"
              size={28}
              color={theme.tabIconSelected}
            />
          </View>
          <Text style={[styles.quickActionText, { color: theme.text }]}>
            Relatórios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/(stack)/index')}
          style={[
            styles.quickActionItem,
            { backgroundColor: theme.tint + '20' },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="cog"
              size={28}
              color={theme.tint}
            />
          </View>
          <Text style={[styles.quickActionText, { color: theme.text }]}>
            Configurações
          </Text>
        </TouchableOpacity>
      </View>

      <ConstructionModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionItem: {
    width: (width - 72) / 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    maxHeight: 120,
  },
  iconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    flexShrink: 1,
  },
});