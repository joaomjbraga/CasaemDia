import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers } from '../contexts/FamilyMembersContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('0,00');
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [budgetLoading, setBudgetLoading] = useState<boolean>(true);
  const [deletingMember, setDeletingMember] = useState<number | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const {
    familyMembers,
    loading: memberLoading,
    addFamilyMember,
    deleteFamilyMember,
    fetchFamilyMembers,
  } = useFamilyMembers();
  const router = useRouter();
  const { user } = useAuth();
  const colors = Colors.light;

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;

    try {
      setBudgetLoading(true);
      console.log('Settings: Fetching balance for user_id:', user.id);

      const { data, error } = await supabase
        .from('balances')
        .select('monthly_budget')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const formattedBudget = data.monthly_budget?.toFixed(2).replace('.', ',') || '0,00';
        setMonthlyBudget(formattedBudget);
        console.log('Settings: Current budget:', formattedBudget);
      } else {
        console.log('Settings: Creating initial balance record');
        const { error: insertError } = await supabase
          .from('balances')
          .insert({
            user_id: user.id,
            total_balance: 0,
            monthly_budget: 0,
          });

        if (insertError) throw insertError;
        setMonthlyBudget('0,00');
      }
    } catch (error: any) {
      console.error('Settings: Error fetching balance:', error);
      Alert.alert('Erro', 'Falha ao carregar orçamento: ' + error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const updateBalance = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      setSaveLoading(true);
      const budgetValueString = monthlyBudget.replace(',', '.');
      const budgetValue = parseFloat(budgetValueString);

      if (isNaN(budgetValue) || budgetValue < 0) {
        Alert.alert('Erro', 'Por favor, insira um valor válido para o orçamento (ex.: 1234,56)');
        return;
      }

      console.log('Settings: Updating budget to:', budgetValue);
      const { error } = await supabase
        .from('balances')
        .upsert(
          {
            user_id: user.id,
            monthly_budget: budgetValue,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      Alert.alert('Sucesso', 'Orçamento atualizado com sucesso!');
    } catch (error: any) {
      console.error('Settings: Error updating balance:', error);
      Alert.alert('Erro', 'Falha ao atualizar orçamento: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do membro.');
      return;
    }

    try {
      await addFamilyMember(newMemberName.trim());
      setNewMemberName('');
    } catch (error) {
      console.error('Settings: Error adding member:', error);
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    console.log('🗑️ Settings: Attempting to delete member:', {
      memberId,
      memberName,
      userId: user?.id,
      currentMembersCount: familyMembers.length,
    });

    Alert.alert(
      'Confirmar Remoção',
      `Tem certeza que deseja remover "${memberName}" da família ? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => console.log('❌ Delete cancelled by user') },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            console.log('✅ User confirmed deletion, starting process...');

            try {
              setDeletingMember(memberId);
              console.log('🔄 Settings: Starting delete process for member ID:', memberId);

              if (!user) {
                throw new Error('Usuário não autenticado');
              }

              console.log(`🔍 Checking if member "${memberName}" has associated tasks...`);

              const { data: tasksData, error: tasksCheckError } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('assignee', memberName)
                .eq('user_id', user.id);

              if (tasksCheckError) {
                console.error('❌ Error checking tasks:', tasksCheckError);
                throw new Error('Erro ao verificar tarefas associadas: ' + tasksCheckError.message);
              }

              if (tasksData && tasksData.length > 0) {
                console.log('⚠️ Member has associated tasks:', tasksData);
                Alert.alert(
                  'Não é Possível Remover',
                  `${memberName} tem ${tasksData.length} tarefa(s) associada(s): \n\n` +
                  tasksData.map(task => `• ${task.title} `).join('\n') +
                  '\n\nRemova ou reatribua as tarefas primeiro.',
                  [{ text: 'OK' }]
                );
                return;
              }

              console.log('✅ No tasks found for this member, proceeding with deletion...');

              // Verificar e excluir mensagens associadas ao membro
              console.log(`🔍 Checking if member "${memberName}" has associated messages...`);
              const { error: messagesDeleteError } = await supabase
                .from('messages')
                .delete()
                .eq('family_member_id', memberId)
                .eq('user_id', user.id);

              if (messagesDeleteError) {
                console.error('❌ Error deleting messages for member:', messagesDeleteError);
                throw new Error('Erro ao excluir mensagens associadas: ' + messagesDeleteError.message);
              }

              console.log('✅ Messages deleted successfully, proceeding with member deletion...');

              const { error: deleteError } = await supabase
                .from('family_members')
                .delete()
                .eq('id', memberId)
                .eq('user_id', user.id);

              if (deleteError) {
                console.error('❌ Error deleting member:', deleteError);
                throw deleteError;
              }

              console.log('✅ Member deleted successfully from database');

              console.log('🔄 Refreshing family members list...');
              await fetchFamilyMembers();

              Alert.alert('Sucesso', `${memberName} foi removido da família.`);
            } catch (error: any) {
              console.error('❌ Settings: Error deleting member:', {
                error: error,
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
              });

              let errorMessage = error?.message || 'Erro desconhecido ao remover membro';
              Alert.alert(
                'Erro ao Remover Membro',
                `Não foi possível remover "${memberName}".\n\nDetalhes: ${errorMessage} `
              );
            } finally {
              console.log('🔚 Settings: Finishing delete process, resetting loading state');
              setDeletingMember(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.id) {
      console.error('❌ No authenticated user found');
      Alert.alert('Erro', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e removerá todos os seus dados, incluindo orçamento, eventos, despesas, membros da família, inventário, mensagens, listas de compras e tarefas.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => console.log('❌ Account deletion cancelled by user') },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            console.log('✅ User confirmed account deletion, starting process for user ID:', user.id);
            try {
              setDeletingAccount(true);

              // Verificar se há registros nas tabelas antes de excluir
              const tablesToCheck = [
                'messages',
                'tasks',
                'shopping_list',
                'inventory',
                'expenses',
                'events',
                'family_members',
                'balances',
              ];

              for (const table of tablesToCheck) {
                console.log(`🔍 Checking records in ${table} for user ID: ${user.id} `);
                const { data, error } = await supabase
                  .from(table)
                  .select('id')
                  .eq('user_id', user.id)
                  .limit(10);

                if (error) {
                  console.error(`❌ Error checking records in ${table}: `, error);
                  throw new Error(`Erro ao verificar registros em ${table}: ${error.message} `);
                }

                if (data && data.length > 0) {
                  console.log(`ℹ️ Found ${data.length} records in ${table}: `, data);
                } else {
                  console.log(`✅ No records found in ${table} `);
                }
              }

              // Ordem ajustada para respeitar dependências de chaves estrangeiras
              const tables = [
                'messages', // Excluir mensagens primeiro devido à dependência com family_members
                'tasks',
                'shopping_list',
                'inventory',
                'expenses',
                'events',
                'family_members', // family_members depois de messages
                'balances',
              ];

              // Executar exclusões com verificação reforçada
              for (const table of tables) {
                console.log(`🗑️ Attempting to delete records from ${table} for user ID: ${user.id} `);
                const { data, error } = await supabase
                  .from(table)
                  .delete()
                  .eq('user_id', user.id)
                  .select('id'); // Retorna os IDs dos registros excluídos

                if (error) {
                  console.error(`❌ Error deleting from ${table}: `, error);
                  let errorMessage = error.message;
                  if (error.code === '42501') {
                    errorMessage = `Permissão negada para excluir registros em ${table}.Verifique as políticas de RLS.`;
                  } else if (error.code === '23503') {
                    errorMessage = `Não foi possível excluir dados de ${table} devido a referências em outras tabelas.`;
                  }
                  throw new Error(`Erro ao excluir dados de ${table}: ${errorMessage} `);
                }

                console.log(`✅ Deleted ${data?.length || 0} records from ${table} `, data);
              }

              // Verificação final para mensagens residuais
              console.log('🔍 Final check for residual messages...');
              const { data: postDeleteMessages, error: postDeleteError } = await supabase
                .from('messages')
                .select('id, content, family_member_id')
                .eq('user_id', user.id);

              if (postDeleteError) {
                console.error('❌ Error checking post-deletion messages:', postDeleteError);
                throw new Error('Erro ao verificar mensagens após exclusão: ' + postDeleteError.message);
              }

              if (postDeleteMessages && postDeleteMessages.length > 0) {
                console.log('⚠️ Found residual messages after deletion attempt:', postDeleteMessages);
                const messageDetails = postDeleteMessages.map(msg => `• ID: ${msg.id}, Conteúdo: ${msg.content} `).join('\n');
                throw new Error(
                  `Erro: ${postDeleteMessages.length} mensagem(s) ainda presentes após tentativa de exclusão: \n\n` +
                  messageDetails +
                  '\n\nPor favor, contate o suporte.'
                );
              }

              // Excluir a conta do usuário na autenticação do Supabase
              console.log('🔄 Signing out before deleting user account...');
              const { error: authError } = await supabase.auth.signOut();
              if (authError) {
                console.error('❌ Error signing out before account deletion:', authError);
                throw authError;
              }

              // Chamar função de administração para excluir o usuário
              console.log('🔄 Calling admin function to delete user account...');
              const { error: adminError } = await supabase.rpc('delete_user', { user_id: user.id });

              if (adminError) {
                console.error('❌ Error deleting user account:', adminError);
                throw new Error('Erro ao excluir conta do usuário: ' + adminError.message);
              }

              console.log('✅ User account deleted successfully');
              Alert.alert('Sucesso', 'Sua conta foi excluída com sucesso.');
              router.replace('/(auth)/login');
            } catch (error: any) {
              console.error('❌ Settings: Error deleting account:', {
                error: error,
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
              });
              let errorMessage = error?.message || 'Erro desconhecido ao excluir a conta';
              Alert.alert('Erro', `Falha ao excluir conta: ${errorMessage} `);
            } finally {
              console.log('🔚 Settings: Finishing account deletion process');
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const formatBudgetInput = (text: string) => {
    const cleaned = text.replace(/[^0-9,]/g, '');
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      return monthlyBudget;
    }

    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
    }

    return parts.join(',');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erro', 'Falha ao fazer logout: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Voltar para a tela anterior"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>Finanças</Text>
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accentBlue + '20' }]}>
                <MaterialCommunityIcons name="wallet" size={24} color={colors.accentBlue} />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Orçamento Mensal</Text>
                <View style={styles.inputGroup}>
                  {budgetLoading ? (
                    <View style={[styles.loadingInput, { backgroundColor: colors.progressBackground }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.mutedText }]}>Carregando...</Text>
                    </View>
                  ) : (
                    <View style={[styles.currencyInputContainer, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                      <Text style={[styles.currencyPrefix, { color: colors.primary }]}>R$</Text>
                      <TextInput
                        style={[styles.currencyInput, { color: colors.text }]}
                        value={monthlyBudget}
                        onChangeText={(text) => setMonthlyBudget(formatBudgetInput(text))}
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                        placeholderTextColor={colors.mutedText}
                        editable={!budgetLoading}
                      />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    (saveLoading || budgetLoading) && { opacity: 0.6 },
                  ]}
                  onPress={updateBalance}
                  disabled={saveLoading || budgetLoading}
                  activeOpacity={0.8}
                >
                  {saveLoading ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={18} color={colors.textWhite} />
                      <Text style={[styles.buttonText, { color: colors.textWhite }]}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedText} />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>Membros da Família</Text>
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.illustrationPurple + '20' }]}>
                <MaterialCommunityIcons name="account-plus" size={24} color={colors.illustrationPurple} />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Adicionar Membro</Text>
                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={newMemberName}
                      onChangeText={setNewMemberName}
                      placeholder="Nome do membro"
                      placeholderTextColor={colors.mutedText}
                      maxLength={50}
                      editable={!memberLoading}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: colors.buttonSecondary },
                    (memberLoading || !newMemberName.trim()) && { opacity: 0.6 },
                  ]}
                  onPress={handleAddMember}
                  disabled={memberLoading || !newMemberName.trim()}
                  activeOpacity={0.8}
                >
                  {memberLoading ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="plus" size={18} color={colors.textWhite} />
                      <Text style={[styles.buttonText, { color: colors.textWhite }]}>Adicionar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedText} />
          </View>

          {memberLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedText }]}>Carregando membros...</Text>
            </View>
          ) : familyMembers.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.mutedText + '20' }]}>
                <MaterialCommunityIcons name="account-multiple-outline" size={24} color={colors.mutedText} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum membro ainda</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                Adicione membros da família para começar a atribuir tarefas
              </Text>
            </View>
          ) : (
            familyMembers.map((member, index) => (
              <View key={member.id} style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.sectionTextContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{member.name}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteMember(member.id, member.name)}
                  style={[
                    styles.actionButton,
                    deletingMember === member.id && { opacity: 0.6 },
                  ]}
                  disabled={deletingMember === member.id}
                  accessibilityLabel={`Remover ${member.name} `}
                >
                  {deletingMember === member.id ? (
                    <ActivityIndicator size={20} color={colors.danger} />
                  ) : (
                    <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>Conta</Text>
          {user && (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.sectionContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.accentCyan + '20' }]}>
                  <MaterialCommunityIcons name="email" size={24} color={colors.accentCyan} />
                </View>
                <View style={styles.sectionTextContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Email</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>{user.email}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedText} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBackground }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <View style={styles.sectionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
                <MaterialCommunityIcons name="logout" size={24} color={colors.danger} />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>Sair da Conta</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.section, { backgroundColor: colors.cardBackground }]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.8}
          >
            <View style={styles.sectionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
                <MaterialCommunityIcons name="account-cancel" size={24} color={colors.danger} />
              </View>
              <View style={styles.sectionTextContainer}>
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>Excluir Conta</Text>
              </View>
            </View>
            {deletingAccount ? (
              <ActivityIndicator size={20} color={colors.danger} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedText} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 12,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  inputGroup: {
    marginTop: 8,
    marginBottom: 12,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 14,
    paddingVertical: 8,
  },
  loadingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginHorizontal: 20,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});