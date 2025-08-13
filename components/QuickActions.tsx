import Colors from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConstructionModal from './ConstructionModal';

const { width } = Dimensions.get('window');

interface QuickActionsProps {
  // Removida a prop theme e isDark, pois usaremos apenas Colors.light
}

export default function QuickActions({ }: QuickActionsProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={[styles.quickActions, { backgroundColor: Colors.light.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
        Ações Rápidas
      </Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/shoppinglist')}
          style={[styles.quickActionItem]}
          activeOpacity={0.6}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="cart-plus"
              size={30}
              color={Colors.light.primary}
            />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
            Lista de Compras
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openModal}
          style={[styles.quickActionItem]}
          activeOpacity={0.6}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="target"
              size={30}
              color={Colors.light.primary}
            />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
            Metas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/ExpenseReportScreen')}
          style={[styles.quickActionItem]}
          activeOpacity={0.6}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="chart-line"
              size={30}
              color={Colors.light.primary}
            />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
            Relatórios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate('/EstoqueScreen')}
          style={[styles.quickActionItem]}
          activeOpacity={0.6}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="food"
              size={30}
              color={Colors.light.primary}
            />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
            Estoque da Casa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate('/_settings')}
          style={[styles.quickActionItem]}
          activeOpacity={0.6}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="cog"
              size={30}
              color={Colors.light.primary}
            />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
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
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 24,
    borderRadius: 24,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionItem: {
    width: (width - 56) / 2, // Ajustado para melhor espaçamento
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary + '90', // Fundo com opacidade
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    minHeight: 120,
    transitionDuration: '200ms', // Para feedback visual suave (se suportado)
  },
  iconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    flexShrink: 1,
  },
});