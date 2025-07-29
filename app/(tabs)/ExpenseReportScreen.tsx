import { useTheme } from '@/contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { handleSupabaseError, supabase } from '../../lib/supabase';

interface Expense {
  amount: number;
  description: string;
  payer: string;
  created_at: string;
}

export default function ExpenseReportScreen() {
  const { isDark } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  // Função para formatar números brasileiros
  const formatCurrency = useCallback((value: number | string | null | undefined): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (numericValue == null || isNaN(numericValue)) {
      console.log('formatCurrency: valor inválido', { value, numericValue });
      return 'R$ 0,00';
    }
    const formatted = Math.abs(numericValue).toFixed(2).replace('.', ',');
    return `${numericValue < 0 ? '-' : ''}R$ ${formatted}`;
  }, []);

  // Função para formatar data
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Obtém o ID do usuário autenticado
  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Usuário não autenticado');
      console.log('Usuário autenticado:', user.id);
      return user.id;
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao obter usuário');
      console.error('Erro ao obter usuário:', error);
      Alert.alert('Erro', errorMessage);
      return null;
    }
  }, []);

  // Busca dados do Supabase
  const fetchData = useCallback(async (currentUserId: string) => {
    if (!currentUserId || !isMountedRef.current) {
      console.log('fetchData ignorado:', { currentUserId, isMounted: isMountedRef.current });
      return;
    }

    setIsLoading(true);
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('monthly_budget')
        .eq('user_id', currentUserId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      const newMonthlyBudget = Number(balanceData?.monthly_budget) || 0;

      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, description, payer, created_at')
        .eq('user_id', currentUserId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      const totalExpenses = expensesData?.reduce((sum: number, expense: Expense) => sum + Number(expense.amount), 0) || 0;
      const formattedExpenses = expensesData?.map((expense: Expense) => ({
        ...expense,
        amount: Number(expense.amount),
      })) || [];

      if (isMountedRef.current) {
        console.log('Dados atualizados:', { newMonthlyBudget, totalExpenses, formattedExpenses });
        setMonthlyBudget(newMonthlyBudget);
        setTotalExpenses(totalExpenses);
        setExpenses(formattedExpenses);

        if (newMonthlyBudget === 0 && totalExpenses > 0) {
          Alert.alert('Aviso', 'Seu orçamento mensal está definido como zero. Considere configurar um valor.');
        }
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao buscar dados do relatório');
      console.error('Erro ao buscar dados:', error);
      if (isMountedRef.current) {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Configura dados e assinaturas em tempo real
  useEffect(() => {
    const initialize = async () => {
      const id = await getUserId();
      if (id && isMountedRef.current) {
        setUserId(id);
        await fetchData(id);

        const subscription = supabase
          .channel(`report_changes_${id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${id}` },
            (payload) => {
              console.log('Evento expenses_changes:', payload);
              if (isMountedRef.current) fetchData(id);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'balances', filter: `user_id=eq.${id}` },
            (payload) => {
              console.log('Evento balances_changes:', payload);
              if (isMountedRef.current) fetchData(id);
            }
          )
          .subscribe((status) => {
            console.log('Status da assinatura:', status);
            if (status === 'SUBSCRIBED' && isMountedRef.current) {
              fetchData(id);
            }
          });

        subscriptionRef.current = subscription;
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        console.log('Removendo assinatura do canal');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [getUserId, fetchData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Carregando relatório...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#C9F31D', '#9AB821'] : ['#3E8E7E', '#2D6B5F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
          ]}>
            <MaterialCommunityIcons
              name="chart-bar"
              color={isDark ? '#1E1E1E' : '#FFFFFF'}
              size={24}
            />
          </View>
          <Text style={[styles.headerTitle, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            Relatório de Gastos
          </Text>
        </View>
      </View>

      <View style={[
        styles.summary,
        { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
      ]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
            Total de Gastos
          </Text>
          <Text style={[styles.summaryValue, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            {formatCurrency(totalExpenses)}
          </Text>
        </View>
        {monthlyBudget > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
              Restante do Orçamento
            </Text>
            <Text style={[
              styles.summaryValue,
              {
                color: totalExpenses > monthlyBudget ? '#ef4444' : (isDark ? '#1E1E1E' : '#FFFFFF')
              }
            ]}>
              {formatCurrency(monthlyBudget - totalExpenses)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.expenseList}>
        {expenses.length > 0 ? (
          expenses.map((expense, index) => (
            <View
              key={index}
              style={[
                styles.expenseItem,
                { borderBottomColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
              ]}
            >
              <View style={[
                styles.expenseIndicator,
                { backgroundColor: isDark ? '#26352a' : '#22c55e' }
              ]} />
              <View style={styles.expenseDetails}>
                <Text style={[styles.expenseDescription, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                  {expense.description}
                </Text>
                <Text style={[styles.expensePayer, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                  Pagador: {expense.payer}
                </Text>
                <Text style={[styles.expenseDate, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                  Data: {formatDate(expense.created_at)}
                </Text>
              </View>
              <Text style={[styles.expenseAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                {formatCurrency(expense.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noExpensesText, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
            Nenhuma despesa registrada este mês.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summary: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseList: {
    flex: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expenseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expensePayer: {
    fontSize: 13,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 13,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  noExpensesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
});