import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Colors from '../../constants/Colors';
import { handleSupabaseError, supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Expense {
  amount: number;
  description: string;
  payer: string;
  created_at: string;
}

export default function ExpenseReportScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  const formatCurrency = useCallback((value: number | string | null | undefined): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (numericValue == null || isNaN(numericValue)) return 'R$ 0,00';
    const formatted = Math.abs(numericValue).toFixed(2).replace('.', ',');
    return `${numericValue < 0 ? '-' : ''}R$ ${formatted}`;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Usuário não autenticado');
      return user.id;
    } catch (error) {
      Alert.alert('Erro', handleSupabaseError(error, 'ao obter usuário'));
      return null;
    }
  }, []);

  const fetchData = useCallback(async (currentUserId: string) => {
    if (!currentUserId || !isMountedRef.current) return;
    setIsLoading(true);
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('monthly_budget')
        .eq('user_id', currentUserId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

      const newMonthlyBudget = Number(balanceData?.monthly_budget) || 0;

      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, description, payer, created_at')
        .eq('user_id', currentUserId)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      const total = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const formatted = expensesData?.map((e) => ({ ...e, amount: Number(e.amount) })) || [];

      if (isMountedRef.current) {
        setMonthlyBudget(newMonthlyBudget);
        setTotalExpenses(total);
        setExpenses(formatted);
        if (newMonthlyBudget === 0 && total > 0) {
          Alert.alert('Aviso', 'Seu orçamento mensal está definido como zero.');
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        Alert.alert('Erro', handleSupabaseError(error, 'ao buscar dados'));
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const id = await getUserId();
      if (id && isMountedRef.current) {
        setUserId(id);
        await fetchData(id);

        const sub = supabase
          .channel(`report_changes_${id}`)
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${id}`,
          }, () => fetchData(id))
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'balances', filter: `user_id=eq.${id}`,
          }, () => fetchData(id))
          .subscribe();

        subscriptionRef.current = sub;
      }
    };

    initialize();
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [getUserId, fetchData]);

  const getBudgetPercentage = () => {
    if (monthlyBudget === 0) return 0;
    return Math.min((totalExpenses / monthlyBudget) * 100, 100);
  };

  const getRemainingBudget = () => monthlyBudget - totalExpenses;

  const getBudgetStatus = () => {
    const remaining = getRemainingBudget();
    const percentage = getBudgetPercentage();

    if (remaining < 0) return { color: Colors.light.danger, status: 'Orçamento Excedido' };
    if (percentage > 80) return { color: Colors.light.warning, status: 'Atenção!' };
    return { color: Colors.light.success, status: 'No Controle' };
  };

  const getExpenseIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('comida')) return 'cart';
    if (desc.includes('transporte') || desc.includes('uber') || desc.includes('combustível')) return 'car';
    if (desc.includes('lazer') || desc.includes('cinema') || desc.includes('restaurante')) return 'movie';
    if (desc.includes('saúde') || desc.includes('médico') || desc.includes('farmácia')) return 'medical-bag';
    if (desc.includes('conta') || desc.includes('luz') || desc.includes('água')) return 'receipt';
    return 'cash';
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.light.background }]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Carregando relatório...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <StatusBar barStyle={'default'} backgroundColor={Colors.light.primary} />
      {/* Header com gradiente visual */}
      <View style={[styles.header, { backgroundColor: Colors.light.primary }]}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.light.textWhite }]}>
            <MaterialCommunityIcons
              name="chart-line"
              color={Colors.light.primary}
              size={28}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: Colors.light.textWhite }]}>
              Relatório de Gastos
            </Text>
            <Text style={[styles.headerSubtitle, { color: Colors.light.textWhite }]}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards de Resumo */}
        <View style={styles.summaryContainer}>
          {/* Total de Gastos */}
          <View style={[styles.summaryCard, { backgroundColor: Colors.light.cardBackground }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: Colors.light.accentBlue + '20' }]}>
                <MaterialCommunityIcons name="trending-up" size={24} color={Colors.light.accentBlue} />
              </View>
              <Text style={[styles.cardLabel, { color: Colors.light.mutedText }]}>Total de Gastos</Text>
            </View>
            <Text style={[styles.cardValue, { color: Colors.light.text }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>

          {/* Orçamento */}
          {monthlyBudget > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: Colors.light.cardBackground }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: getBudgetStatus().color + '20' }]}>
                  <MaterialCommunityIcons
                    name="wallet"
                    size={24}
                    color={getBudgetStatus().color}
                  />
                </View>
                <Text style={[styles.cardLabel, { color: Colors.light.mutedText }]}>
                  {getBudgetStatus().status}
                </Text>
              </View>
              <Text style={[styles.cardValue, { color: getBudgetStatus().color }]}>
                {formatCurrency(getRemainingBudget())}
              </Text>

              {/* Barra de Progresso */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: Colors.light.borderLight }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getBudgetPercentage()}%`,
                        backgroundColor: getBudgetStatus().color
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: Colors.light.mutedText }]}>
                  {getBudgetPercentage().toFixed(0)}% do orçamento usado
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Lista de Despesas */}
        <View style={[styles.expensesSection, { backgroundColor: Colors.light.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
              Despesas do Mês
            </Text>
            <View style={[styles.expenseCount, { backgroundColor: Colors.light.primary }]}>
              <Text style={[styles.expenseCountText, { color: Colors.light.textWhite }]}>
                {expenses.length}
              </Text>
            </View>
          </View>

          {expenses.length > 0 ? (
            expenses.map((expense, index) => (
              <View key={index} style={styles.expenseItem}>
                <View style={[styles.expenseIcon, { backgroundColor: Colors.light.illustrationCyan + '20' }]}>
                  <MaterialCommunityIcons
                    name={getExpenseIcon(expense.description)}
                    size={20}
                    color={Colors.light.illustrationCyan}
                  />
                </View>

                <View style={styles.expenseDetails}>
                  <Text style={[styles.expenseDescription, { color: Colors.light.text }]}>
                    {expense.description}
                  </Text>
                  <View style={styles.expenseMetadata}>
                    <View style={styles.metadataItem}>
                      <MaterialIcons name="person" size={14} color={Colors.light.mutedText} />
                      <Text style={[styles.expensePayer, { color: Colors.light.mutedText }]}>
                        {expense.payer}
                      </Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <MaterialIcons name="date-range" size={14} color={Colors.light.mutedText} />
                      <Text style={[styles.expenseDate, { color: Colors.light.mutedText }]}>
                        {formatDate(expense.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.expenseAmountContainer}>
                  <Text style={[styles.expenseAmount, { color: Colors.light.text }]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: Colors.light.borderLight }]}>
                <MaterialCommunityIcons
                  name="receipt"
                  size={48}
                  color={Colors.light.mutedText}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: Colors.light.text }]}>
                Nenhuma despesa encontrada
              </Text>
              <Text style={[styles.emptyDescription, { color: Colors.light.mutedText }]}>
                Você ainda não registrou despesas este mês
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  header: {
    paddingTop: 60,
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
    fontSize: 16,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    marginTop: -10,
    marginBottom: 30,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  expensesSection: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expenseCountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  expenseIcon: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  expenseMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expensePayer: {
    fontSize: 12,
    marginLeft: 4,
  },
  expenseDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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
});