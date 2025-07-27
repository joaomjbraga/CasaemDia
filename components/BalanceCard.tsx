import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BalanceCardProps {
  isDark: boolean;
  theme: any;
}

export default function BalanceCard({ isDark, theme }: BalanceCardProps) {
  return (
    <LinearGradient
      colors={isDark ? ['#C9F31D', '#9AB821'] : ['#3E8E7E', '#2D6B5F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.balanceCard}
    >
      <View style={styles.balanceHeader}>
        <View style={styles.balanceHeaderContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="wallet" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={24} />
          </View>
          <Text style={[styles.balanceLabel, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>Saldo Conjunto</Text>
        </View>
        <TouchableOpacity style={[styles.balanceAction, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
          <MaterialCommunityIcons name="plus" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.balanceAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>R$ 2.250,00</Text>

      <View style={styles.balanceProgress}>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
          <View style={[styles.progressFill, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', width: '65%' }]} />
        </View>
        <Text style={[styles.progressText, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>65% do orçamento mensal</Text>
      </View>

      <View style={[styles.balanceDetails, { borderTopColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
        <View style={styles.expenseRow}>
          <Text style={[styles.expenseLabel, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>Gastos do mês</Text>
          <Text style={[styles.expenseAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>R$ 1.462,50</Text>
        </View>
        <View style={styles.lastExpenseRow}>
          <View style={[styles.expenseIndicator, { backgroundColor: isDark ? '#26352a' : '#22c55e' }]} />
          <Text style={[styles.lastExpenseText, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
            João pagou R$ 200 - Conta de Luz ⚡
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    marginTop: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceAction: {
    padding: 8,
    borderRadius: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceProgress: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
  },
  balanceDetails: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLabel: {
    fontSize: 14,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  lastExpenseText: {
    fontSize: 13,
    flex: 1,
  },
});