// components/InventoryStats.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { InventoryItem } from '../types/inventory';

interface InventoryStatsProps {
  items: InventoryItem[];
  onFilterPress: (filter: string) => void;
}

export default function InventoryStats({ items, onFilterPress }: InventoryStatsProps) {
  const totalItems = items.length;
  const needRestockCount = items.filter(item => item.needs_restock).length;

  const expiringSoonCount = items.filter(item => {
    if (!item.expiration_date) return false;
    const today = new Date();
    const expDate = new Date(item.expiration_date);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  const categoryStats = {
    alimentos: items.filter(item => item.category === 'alimentos').length,
    limpeza: items.filter(item => item.category === 'limpeza').length,
    higiene: items.filter(item => item.category === 'higiene').length,
    outros: items.filter(item => item.category === 'outros').length,
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    onPress
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardClickable]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color={Colors.light.textWhite} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (totalItems === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Resumo do Estoque</Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total de Itens"
          value={totalItems}
          icon="cube"
          color={Colors.light.primary}
        />

        <StatCard
          title="Precisam Repor"
          value={needRestockCount}
          icon="alert-circle"
          color={Colors.light.warning}
          onPress={() => onFilterPress('restock')}
        />

        <StatCard
          title="Vencem em 7 dias"
          value={expiringSoonCount}
          icon="time"
          color={Colors.light.danger}
        />

        <StatCard
          title="Alimentos"
          value={categoryStats.alimentos}
          icon="restaurant"
          color={Colors.light.illustrationCyan}
          onPress={() => onFilterPress('alimentos')}
        />

        <StatCard
          title="Limpeza"
          value={categoryStats.limpeza}
          icon="sparkles"
          color={Colors.light.illustrationTeal}
          onPress={() => onFilterPress('limpeza')}
        />

        <StatCard
          title="Higiene"
          value={categoryStats.higiene}
          icon="water"
          color={Colors.light.illustrationPink}
          onPress={() => onFilterPress('higiene')}
        />
      </View>

      {(needRestockCount > 0 || expiringSoonCount > 0) && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>⚠️ Atenção Necessária</Text>

          {needRestockCount > 0 && (
            <TouchableOpacity
              style={styles.alertItem}
              onPress={() => onFilterPress('restock')}
            >
              <Ionicons name="alert-circle" size={18} color={Colors.light.warning} />
              <Text style={styles.alertText}>
                {needRestockCount} {needRestockCount === 1 ? 'item precisa' : 'itens precisam'} de reposição
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.mutedText} />
            </TouchableOpacity>
          )}

          {expiringSoonCount > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="time" size={18} color={Colors.light.danger} />
              <Text style={styles.alertText}>
                {expiringSoonCount} {expiringSoonCount === 1 ? 'item vence' : 'itens vencem'} em até 7 dias
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
    maxWidth: '48%',
  },
  statCardClickable: {
    transform: [{ scale: 1 }],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.light.mutedText,
    textAlign: 'center',
    fontWeight: '500',
  },
  alertsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    marginRight: 8,
  },
});

// Hook customizado para estatísticas do estoque
export const useInventoryStats = (items: InventoryItem[]) => {
  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const needRestockCount = items.filter(item => item.needs_restock).length;

    const expiringSoonCount = items.filter(item => {
      if (!item.expiration_date) return false;
      const today = new Date();
      const expDate = new Date(item.expiration_date);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    }).length;

    const expiredCount = items.filter(item => {
      if (!item.expiration_date) return false;
      const today = new Date();
      const expDate = new Date(item.expiration_date);
      return expDate < today;
    }).length;

    const categoryStats = {
      alimentos: items.filter(item => item.category === 'alimentos').length,
      limpeza: items.filter(item => item.category === 'limpeza').length,
      higiene: items.filter(item => item.category === 'higiene').length,
      outros: items.filter(item => item.category === 'outros').length,
    };

    const totalValue = items.reduce((sum, item) => {
      return sum + (item.current_quantity * 1); // Assumindo valor unitário de 1 para exemplo
    }, 0);

    return {
      totalItems,
      needRestockCount,
      expiringSoonCount,
      expiredCount,
      categories: categoryStats,
      totalValue,
      lowStockPercentage: totalItems > 0 ? (needRestockCount / totalItems) * 100 : 0,
    };
  }, [items]);

  return stats;
};