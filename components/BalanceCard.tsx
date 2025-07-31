import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, DimensionValue, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { handleSupabaseError, supabase } from '../lib/supabase';

interface BalanceCardProps {
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

export default function BalanceCard({ theme }: BalanceCardProps) {
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

  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  const formatCurrency = useCallback((value: number | string | null | undefined): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (numericValue == null || isNaN(numericValue)) {
      console.log('formatCurrency: valor inválido', { value, numericValue });
      return 'R$ 0,00';
    }
    const formatted = Math.abs(numericValue).toFixed(2).replace('.', ',');
    return `${numericValue < 0 ? '-' : ''}R$ ${formatted}`;
  }, []);

  const parseCurrencyValue = useCallback((value: string): number => {
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    console.log('parseCurrencyValue:', { input: value, cleanValue, parsed });
    return isNaN(parsed) ? 0 : parsed;
  }, []);

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

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setNewExpenseData({ amount: '', description: '', payer: '' });
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

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
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <View style={styles.balanceHeaderContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="wallet"
                color={Colors.light.iconPrimary}
                size={24}
              />
            </View>
            <Text style={styles.balanceLabel}>Saldo Conjunto</Text>
          </View>
          <TouchableOpacity
            style={styles.balanceAction}
            onPress={openModal}
            disabled={isSubmitting}
            accessibilityLabel="Adicionar despesa"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="plus"
              color={Colors.light.iconLight}
              size={20}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.balanceAmount}>
          {formatCurrency(monthlyBudget - expenses)}
        </Text>

        <View style={styles.balanceProgress}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              {
                backgroundColor: progressData.isOverBudget ? Colors.light.danger : Colors.light.progressBar,
                width: `${progressData.percentage * 100}%` as DimensionValue
              }
            ]} />
          </View>
          <Text style={[
            styles.progressText,
            { color: progressData.isOverBudget ? Colors.light.danger : Colors.light.text }
          ]}>
            {monthlyBudget === 0
              ? 'Orçamento não definido'
              : progressData.isOverBudget
                ? `${progressData.percentageText} do orçamento (acima do limite!)`
                : `${progressData.percentageText} do orçamento mensal usado`}
          </Text>
        </View>

        <View style={styles.balanceDetails}>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Gastos do mês</Text>
            <Text style={[
              styles.expenseAmount,
              { color: progressData.isOverBudget ? Colors.light.danger : Colors.light.text }
            ]}>
              {formatCurrency(expenses)}
            </Text>
          </View>

          {monthlyBudget > 0 && (
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Restante do orçamento</Text>
              <Text style={[
                styles.expenseAmount,
                { color: progressData.isOverBudget ? Colors.light.danger : Colors.light.text }
              ]}>
                {formatCurrency(monthlyBudget - expenses)}
              </Text>
            </View>
          )}

          {lastExpense ? (
            <View style={styles.lastExpenseRow}>
              <View style={[styles.expenseIndicator, { backgroundColor: Colors.light.success }]} />
              <Text style={styles.lastExpenseText}>
                {lastExpense.payer} pagou {formatCurrency(lastExpense.amount)} - {lastExpense.description}
              </Text>
            </View>
          ) : (
            <Text style={styles.noExpenseText}>Nenhuma despesa registrada este mês.</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Despesa</Text>
            <TextInput
              style={styles.input}
              placeholder="Valor (ex.: 100,50)"
              placeholderTextColor={Colors.light.mutedText}
              keyboardType="decimal-pad"
              value={newExpenseData.amount}
              onChangeText={handleAmountChange}
              maxLength={10}
              accessibilityLabel="Valor da despesa"
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              placeholderTextColor={Colors.light.mutedText}
              value={newExpenseData.description}
              onChangeText={handleDescriptionChange}
              maxLength={100}
              accessibilityLabel="Descrição da despesa"
            />
            <TextInput
              style={styles.input}
              placeholder="Pagador"
              placeholderTextColor={Colors.light.mutedText}
              value={newExpenseData.payer}
              onChangeText={handlePayerChange}
              maxLength={50}
              accessibilityLabel="Nome do pagador"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: Colors.light.buttonPrimary, opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={addExpense}
                disabled={isSubmitting}
                accessibilityLabel={isSubmitting ? 'Adicionando despesa' : 'Adicionar despesa'}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Adicionar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: Colors.light.danger, opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={closeModal}
                disabled={isSubmitting}
                accessibilityLabel="Cancelar adição de despesa"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            {isSubmitting && (
              <ActivityIndicator size="small" color={Colors.light.primary} style={styles.submitIndicator} />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    flex: 1,
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
    backgroundColor: Colors.light.cardBackground,
    padding: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  balanceAction: {
    backgroundColor: Colors.light.buttonSecondary,
    padding: 8,
    borderRadius: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  balanceProgress: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.light.progressBackground,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  balanceDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 16,
    flex: 1,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.mutedText,
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
    color: Colors.light.mutedText,
    flex: 1,
  },
  noExpenseText: {
    fontSize: 13,
    textAlign: 'center',
    color: Colors.light.mutedText,
    marginBottom: 12,
  },
  loadingContainer: {
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: Colors.light.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textWhite,
  },
  submitIndicator: {
    marginTop: 12,
  },
});