import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, DimensionValue, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  // Função para inicializar saldo do usuário se não existir
  const initializeUserBalance = useCallback(async (userId: string) => {
    try {
      const { data: existingBalance, error: checkError } = await supabase
        .from('balances')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      // Se não existe, criar com valores padrão
      if (checkError && checkError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('balances')
          .insert([{
            user_id: userId,
            total_balance: 0,
            monthly_budget: 1000
          }]);

        if (insertError) {
          console.error('Erro ao inicializar saldo:', insertError);
        }
      } else if (checkError) {
        console.error('Erro ao verificar saldo existente:', checkError);
      }
    } catch (error) {
      console.error('Erro na inicialização do saldo:', error);
    }
  }, []);

  // Função helper para atualizar ou criar saldo
  const updateOrCreateBalance = useCallback(async (userId: string, newBalance: number, budget: number) => {
    try {
      // Primeiro tenta fazer um UPDATE
      const { data, error: updateError } = await supabase
        .from('balances')
        .update({
          total_balance: newBalance,
          monthly_budget: budget
        })
        .eq('user_id', userId)
        .select();

      // Se não atualizou nenhuma linha (registro não existe), faz INSERT
      if (!updateError && (!data || data.length === 0)) {
        const { error: insertError } = await supabase
          .from('balances')
          .insert([{
            user_id: userId,
            total_balance: newBalance,
            monthly_budget: budget
          }]);

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Função para formatar números brasileiros
  const formatCurrency = useCallback((value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Função para parsear valor monetário brasileiro
  const parseCurrencyValue = useCallback((value: string): number => {
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }, []);

  // Obtém o ID do usuário autenticado
  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        throw new Error('Usuário não autenticado');
      }
      return user.id;
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao obter usuário');
      console.error('Erro ao obter usuário:', error);
      Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
      return null;
    }
  }, []);

  // Busca dados do Supabase (saldo, orçamento e despesas)
  const fetchData = useCallback(async (currentUserId: string) => {
    if (!currentUserId || !isMountedRef.current) return;

    setIsLoading(true);
    try {
      // Buscar saldo e orçamento
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('total_balance, monthly_budget')
        .eq('user_id', currentUserId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      const newBalance = balanceData?.total_balance ?? 0;
      const newMonthlyBudget = balanceData?.monthly_budget ?? 0;

      // Buscar despesas do mês atual
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

      const totalExpenses = expensesData?.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) ?? 0;
      const mostRecentExpense = expensesData && expensesData.length > 0 ? expensesData[0] : null;

      // Atualizar estado apenas se o componente ainda estiver montado
      if (isMountedRef.current) {
        setBalance(newBalance);
        setMonthlyBudget(newMonthlyBudget);
        setExpenses(totalExpenses);
        setLastExpense(mostRecentExpense);

        // Alerta se o orçamento mensal for zero e houver despesas
        if (newMonthlyBudget === 0 && totalExpenses > 0) {
          Alert.alert('Aviso', 'Seu orçamento mensal está definido como zero. Considere configurar um valor.');
        }
      }
    } catch (error) {
      const errorMessage = handleSupabaseError(error, 'ao buscar dados');
      console.error('Erro ao buscar dados:', error);
      if (isMountedRef.current) {
        Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente.');
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

      // Inserir despesa
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([newExpense]);

      if (expenseError) throw expenseError;

      // Atualizar saldo usando a função helper
      const newBalance = balance - amount;
      await updateOrCreateBalance(userId, newBalance, monthlyBudget || 1000);

      Alert.alert('Sucesso', 'Despesa adicionada com sucesso!');
      setModalVisible(false);
      setNewExpenseData({ amount: '', description: '', payer: '' });

      // Recarregar dados
      await fetchData(userId);
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

  // Configura dados e assinaturas em tempo real na montagem
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      const id = await getUserId();
      if (id && isMountedRef.current) {
        setUserId(id);

        // Inicializar saldo do usuário se necessário
        await initializeUserBalance(id);

        await fetchData(id);

        // Configurar assinatura em tempo real
        const subscription = supabase
          .channel(`expenses_changes_${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'expenses',
              filter: `user_id=eq.${id}`
            },
            () => {
              if (isMountedRef.current) {
                fetchData(id);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'balances',
              filter: `user_id=eq.${id}`
            },
            () => {
              if (isMountedRef.current) {
                fetchData(id);
              }
            }
          )
          .subscribe();

        subscriptionRef.current = subscription;

        cleanup = () => {
          if (subscriptionRef.current) {
            supabase.removeChannel(subscriptionRef.current);
            subscriptionRef.current = null;
          }
        };
      }
    };

    initialize();

    return cleanup;
  }, []); // Array de dependências vazio para executar apenas uma vez

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // Calcula o percentual do orçamento (memoizado para performance)
  const progressData = useMemo(() => {
    if (!monthlyBudget || monthlyBudget <= 0) {
      return {
        percentage: 0,
        percentageText: '0%' as DimensionValue,
        isOverBudget: false
      };
    }

    // Calcular com base nos gastos, não no saldo restante
    const spentPercentage = (expenses / monthlyBudget) * 100;
    const clampedPercentage = Math.min(Math.max(spentPercentage, 0), 100);

    return {
      percentage: spentPercentage,
      percentageText: `${clampedPercentage.toFixed(0)}%` as DimensionValue,
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
        <Text style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={isDark ? ['#C9F31D', '#9AB821'] : ['#3E8E7E', '#2D6B5F']}
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
          R$ {formatCurrency(balance)}
        </Text>

        <View style={styles.balanceProgress}>
          <View style={[
            styles.progressBar,
            { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }
          ]}>
            <View style={[
              styles.progressFill,
              {
                backgroundColor: progressData.isOverBudget
                  ? '#ef4444'
                  : (isDark ? '#1E1E1E' : '#FFFFFF'),
                width: progressData.percentageText
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
            {progressData.isOverBudget
              ? `${progressData.percentage.toFixed(0)}% do orçamento (acima do limite!)`
              : `${progressData.percentageText} do orçamento mensal usado`
            }
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
                color: progressData.isOverBudget
                  ? '#ef4444'
                  : (isDark ? '#1E1E1E' : '#FFFFFF')
              }
            ]}>
              R$ {formatCurrency(expenses)}
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
                  color: progressData.isOverBudget
                    ? '#ef4444'
                    : (isDark ? '#1E1E1E' : '#FFFFFF')
                }
              ]}>
                R$ {formatCurrency(Math.max(monthlyBudget - expenses, 0))}
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
                {lastExpense.payer} pagou R$ {formatCurrency(lastExpense.amount)} - {lastExpense.description}
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

      {/* Modal para adicionar despesa */}
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
                {
                  borderColor: isDark ? '#FFFFFF' : '#000000',
                  color: isDark ? '#FFFFFF' : '#000000'
                }
              ]}
              placeholder="Valor (ex.: 100,50)"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              keyboardType="decimal-pad"
              value={newExpenseData.amount}
              onChangeText={handleAmountChange}
              maxLength={10}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isDark ? '#FFFFFF' : '#000000',
                  color: isDark ? '#FFFFFF' : '#000000'
                }
              ]}
              placeholder="Descrição"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              value={newExpenseData.description}
              onChangeText={handleDescriptionChange}
              maxLength={100}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isDark ? '#FFFFFF' : '#000000',
                  color: isDark ? '#FFFFFF' : '#000000'
                }
              ]}
              placeholder="Pagador"
              placeholderTextColor={isDark ? '#AAAAAA' : '#666666'}
              value={newExpenseData.payer}
              onChangeText={handlePayerChange}
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <Button
                title={isSubmitting ? 'Adicionando...' : 'Adicionar'}
                onPress={addExpense}
                disabled={isSubmitting}
              />
              <Button
                title="Cancelar"
                onPress={closeModal}
                disabled={isSubmitting}
              />
            </View>
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
  noExpenseText: {
    fontSize: 13,
    textAlign: 'center',
  },
  loadingContainer: {
    marginHorizontal: 20,
    padding: 24,
    marginTop: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
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
});