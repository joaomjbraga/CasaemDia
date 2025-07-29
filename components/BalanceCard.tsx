import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, DimensionValue, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { handleSupabaseError, supabase } from '../lib/supabase';

interface BalanceCardProps {
  isDark: boolean;
  theme: any;
}

interface Expense {
  amount: number;
  description: string;
  payer: string;
}

interface BalanceData {
  total_balance: number;
  monthly_budget: number;
}

export default function BalanceCard({ isDark, theme }: BalanceCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [lastExpense, setLastExpense] = useState<Expense | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newExpenseData, setNewExpenseData] = useState({
    amount: '',
    description: '',
    payer: ''
  });

  // Ref para controlar se o componente está montado
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

  // Função para parsear valor monetário brasileiro
  const parseCurrencyValue = useCallback((value: string): number => {
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    console.log('parseCurrencyValue:', { input: value, cleanValue, parsed });
    return isNaN(parsed) ? 0 : parsed;
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

  // Inicializa saldo do usuário se não existir
  const initializeUserBalance = useCallback(async (userId: string) => {
    try {
      const { data: existingBalance, error: checkError } = await supabase
        .from('balances')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        console.log('Inicializando saldo para usuário:', userId);
        const { error: insertError } = await supabase
          .from('balances')
          .insert([{ user_id: userId, total_balance: 0, monthly_budget: 1000 }]);

        if (insertError) throw insertError;
      } else if (checkError) {
        throw checkError;
      }
    } catch (error) {
      console.error('Erro na inicialização do saldo:', error);
    }
  }, []);

  // Função helper para atualizar ou criar saldo
  const updateOrCreateBalance = useCallback(async (userId: string, newBalance: number, budget: number) => {
    try {
      console.log('Atualizando saldo:', { userId, newBalance, budget });
      const { data, error: updateError } = await supabase
        .from('balances')
        .upsert(
          { user_id: userId, total_balance: newBalance, monthly_budget: budget },
          { onConflict: 'user_id' }
        )
        .select();

      if (updateError) throw updateError;
      console.log('Saldo atualizado:', data);
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      throw error;
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
        .select('total_balance, monthly_budget')
        .eq('user_id', currentUserId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      const newBalance = Number(balanceData?.total_balance) || 0;
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
      const mostRecentExpense = expensesData && expensesData.length > 0 ? { ...expensesData[0], amount: Number(expensesData[0].amount) } : null;

      if (isMountedRef.current) {
        console.log('Dados atualizados:', { newBalance, newMonthlyBudget, totalExpenses, mostRecentExpense });
        setBalance(newBalance);
        setMonthlyBudget(newMonthlyBudget);
        setExpenses(totalExpenses);
        setLastExpense(mostRecentExpense);

        if (newMonthlyBudget === 0 && totalExpenses > 0) {
          Alert.alert('Aviso', 'Seu orçamento mensal está definido como zero. Considere configurar um valor.');
        }
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao buscar dados');
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

  // Adiciona uma nova despesa
  const addExpense = useCallback(async () => {
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    const amount = parseCurrencyValue(newExpenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para a despesa (ex.: 100,50).');
      return;
    }
    if (!newExpenseData.description.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma descrição para a despesa.');
      return;
    }
    if (!newExpenseData.payer.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do pagador.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newExpense = {
        amount,
        description: newExpenseData.description.trim(),
        payer: newExpenseData.payer.trim(),
        user_id: userId,
      };

      console.log('Inserindo despesa:', newExpense);
      const { error: expenseError } = await supabase.from('expenses').insert([newExpense]);
      if (expenseError) throw expenseError;

      const newBalance = balance - amount;
      await updateOrCreateBalance(userId, newBalance, monthlyBudget || 1000);

      await fetchData(userId);

      Alert.alert('Sucesso', 'Despesa adicionada com sucesso!');
      setModalVisible(false);
      setNewExpenseData({ amount: '', description: '', payer: '' });
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao adicionar despesa');
      console.error('Erro ao adicionar despesa:', error);
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, newExpenseData, balance, monthlyBudget, fetchData, parseCurrencyValue]);

  // Função para fechar modal
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setNewExpenseData({ amount: '', description: '', payer: '' });
  }, []);

  // Função para abrir modal
  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  // Configura dados e assinaturas em tempo real
  useEffect(() => {
    const initialize = async () => {
      const id = await getUserId();
      if (id && isMountedRef.current) {
        setUserId(id);
        await initializeUserBalance(id);
        await fetchData(id);

        const subscription = supabase
          .channel(`changes_${id}`)
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
  }, [getUserId, initializeUserBalance, fetchData]);

  // Calcula o percentual do orçamento
  const progressData = useMemo(() => {
    if (!monthlyBudget || monthlyBudget <= 0) {
      return {
        percentage: 0,
        percentageText: '0%',
        isOverBudget: false
      };
    }

    const spentPercentage = (expenses / monthlyBudget) * 100;
    const clampedPercentage = Math.min(Math.max(spentPercentage, 0), 100);
    return {
      percentage: clampedPercentage / 100,
      percentageText: `${clampedPercentage.toFixed(0)}%`,
      isOverBudget: spentPercentage > 100
    };
  }, [expenses, monthlyBudget]);

  // Handlers para inputs do modal
  const handleAmountChange = useCallback((text: string) => {
    setNewExpenseData(prev => ({ ...prev, amount: text }));
  }, []);

  const handleDescriptionChange = useCallback((text: string) => {
    setNewExpenseData(prev => ({ ...prev, description: text }));
  }, []);

  const handlePayerChange = useCallback((text: string) => {
    setNewExpenseData(prev => ({ ...prev, payer: text }));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={isDark ? ['#77ac74', '#588d59'] : ['#3E8E7E', '#2D6B5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <View style={styles.balanceHeaderContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="wallet"
                color={isDark ? '#1E1E1E' : '#FFFFFF'}
                size={24}
              />
            </View>
            <Text style={[styles.balanceLabel, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              Saldo Conjunto
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.balanceAction,
              { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
            ]}
            onPress={openModal}
            disabled={isSubmitting}
            accessibilityLabel="Adicionar despesa"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="plus"
              color={isDark ? '#1E1E1E' : '#FFFFFF'}
              size={20}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.balanceAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          {formatCurrency(monthlyBudget - expenses)}
        </Text>

        <View style={styles.balanceProgress}>
          <View style={[
            styles.progressBar,
            { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
          ]}>
            <View style={[
              styles.progressFill,
              {
                backgroundColor: progressData.isOverBudget ? '#ef4444' : (isDark ? '#1E1E1E' : '#FFFFFF'),
                width: `${progressData.percentage * 100}%` as DimensionValue
              }
            ]} />
          </View>
          <Text style={[
            styles.progressText,
            {
              color: progressData.isOverBudget
                ? '#ef4444'
                : (isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)')
            }
          ]}>
            {monthlyBudget === 0
              ? 'Orçamento não definido'
              : progressData.isOverBudget
                ? `${progressData.percentageText} do orçamento (acima do limite!)`
                : `${progressData.percentageText} do orçamento mensal usado`}
          </Text>
        </View>

        <View style={[
          styles.balanceDetails,
          { borderTopColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
        ]}>
          <View style={styles.expenseRow}>
            <Text style={[
              styles.expenseLabel,
              { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
            ]}>
              Gastos do mês
            </Text>
            <Text style={[
              styles.expenseAmount,
              {
                color: progressData.isOverBudget ? '#ef4444' : (isDark ? '#1E1E1E' : '#FFFFFF')
              }
            ]}>
              {formatCurrency(expenses)}
            </Text>
          </View>

          {monthlyBudget > 0 && (
            <View style={styles.expenseRow}>
              <Text style={[
                styles.expenseLabel,
                { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
              ]}>
                Restante do orçamento
              </Text>
              <Text style={[
                styles.expenseAmount,
                {
                  color: progressData.isOverBudget ? '#ef4444' : (isDark ? '#1E1E1E' : '#FFFFFF')
                }
              ]}>
                {formatCurrency(monthlyBudget - expenses)}
              </Text>
            </View>
          )}

          {lastExpense ? (
            <View style={styles.lastExpenseRow}>
              <View style={[
                styles.expenseIndicator,
                { backgroundColor: isDark ? '#26352a' : '#22c55e' }
              ]} />
              <Text style={[
                styles.lastExpenseText,
                { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
              ]}>
                {lastExpense.payer} pagou {formatCurrency(lastExpense.amount)} - {lastExpense.description}
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.noExpenseText,
              { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
            ]}>
              Nenhuma despesa registrada este mês.
            </Text>
          )}
        </View>
      </LinearGradient>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Adicionar Despesa
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: isDark ? '#FFFFFF' : '#000000', color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Valor (ex.: 100,50)"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              keyboardType="decimal-pad"
              value={newExpenseData.amount}
              onChangeText={handleAmountChange}
              maxLength={10}
              accessibilityLabel="Valor da despesa"
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: isDark ? '#FFFFFF' : '#000000', color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Descrição"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              value={newExpenseData.description}
              onChangeText={handleDescriptionChange}
              maxLength={100}
              accessibilityLabel="Descrição da despesa"
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: isDark ? '#FFFFFF' : '#000000', color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Pagador"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              value={newExpenseData.payer}
              onChangeText={handlePayerChange}
              maxLength={50}
              accessibilityLabel="Nome do pagador"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: isDark ? '#77ac74' : '#2D6B5F',
                    opacity: isSubmitting ? 0.6 : 1,
                  }
                ]}
                onPress={addExpense}
                disabled={isSubmitting}
                accessibilityLabel={isSubmitting ? 'Adicionando despesa' : 'Adicionar despesa'}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                  {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: isDark ? '#000000b8' : '#fd5b5b',
                    opacity: isSubmitting ? 0.6 : 1,
                  }
                ]}
                onPress={closeModal}
                disabled={isSubmitting}
                accessibilityLabel="Cancelar adição de despesa"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: isDark ? '#f8f8f8' : '#FFFFFF' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
            {isSubmitting && (
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} style={styles.submitIndicator} />
            )}
          </View>
        </View>
      </Modal>
    </>
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
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 12,
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
  noExpenseText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    marginHorizontal: 20,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitIndicator: {
    marginTop: 12,
  },
});