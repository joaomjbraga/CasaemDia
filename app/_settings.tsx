import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers } from '../contexts/FamilyMembersContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [monthlyBudget, setMonthlyBudget] = useState<string>('0,00');
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [budgetLoading, setBudgetLoading] = useState<boolean>(true);
  const {
    familyMembers,
    loading: memberLoading,
    addFamilyMember,
    deleteFamilyMember,
    fetchFamilyMembers
  } = useFamilyMembers();

  const themeStyles = isDark
    ? {
        background: '#000',
        cardBackground: '#262626',
        text: '#E0E0E0',
        secondaryText: '#A0A0A0',
        border: '#3A4445',
        buttonBackground: '#77ac74',
        buttonBorder: '#588d59',
        buttonText: '#010101',
        deleteButton: '#ff4444',
        warningText: '#ffaa00',
      }
    : {
        background: '#f8f9fa',
        cardBackground: '#fff',
        text: '#333',
        secondaryText: '#666',
        border: '#e0e0e0',
        buttonBackground: '#3E8E7E',
        buttonBorder: '#3E8E7E',
        buttonText: '#fff',
        deleteButton: '#dc3545',
        warningText: '#ff8800',
      };

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
        // Create initial balance record
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
      // Error is already handled in the context
      console.error('Settings: Error adding member:', error);
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    Alert.alert(
      'Confirmar Remoção',
      `Tem certeza que deseja remover "${memberName}" da família? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFamilyMember(memberId);
            } catch (error) {
              console.error('Settings: Error deleting member:', error);
            }
          },
        },
      ]
    );
  };

  const formatBudgetInput = (text: string) => {
    // Remove non-numeric characters except comma
    const cleaned = text.replace(/[^0-9,]/g, '');

    // Ensure only one comma and max 2 decimal places
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      return monthlyBudget; // Return previous value if invalid
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
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.buttonBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Voltar para a tela anterior"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={themeStyles.buttonText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeStyles.buttonText }]}>Configurações</Text>
        <TouchableOpacity
          style={styles.themeButton}
          onPress={toggleTheme}
          accessibilityLabel={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          <MaterialCommunityIcons
            name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'}
            size={24}
            color={themeStyles.buttonText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Finance Section */}
        <View style={[styles.section, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color={themeStyles.buttonBackground} />
            <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Finanças</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeStyles.text }]}>Orçamento Mensal</Text>
            {budgetLoading ? (
              <View style={[styles.input, styles.loadingInput, { borderColor: themeStyles.border, backgroundColor: themeStyles.cardBackground }]}>
                <ActivityIndicator size="small" color={themeStyles.buttonBackground} />
                <Text style={[styles.loadingText, { color: themeStyles.secondaryText }]}>Carregando...</Text>
              </View>
            ) : (
              <View style={styles.currencyInputContainer}>
                <Text style={[styles.currencyPrefix, { color: themeStyles.text }]}>R$</Text>
                <TextInput
                  style={[styles.currencyInput, { borderColor: themeStyles.border, backgroundColor: themeStyles.cardBackground, color: themeStyles.text }]}
                  value={monthlyBudget}
                  onChangeText={(text) => setMonthlyBudget(formatBudgetInput(text))}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={themeStyles.secondaryText}
                  editable={!budgetLoading}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeStyles.buttonBackground }, (saveLoading || budgetLoading) && styles.disabledButton]}
            onPress={updateBalance}
            disabled={saveLoading || budgetLoading}
            activeOpacity={0.8}
          >
            {saveLoading ? (
              <ActivityIndicator size="small" color={themeStyles.buttonText} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color={themeStyles.buttonText} />
                <Text style={[styles.buttonText, { color: themeStyles.buttonText }]}>Salvar Orçamento</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Family Members Section */}
        <View style={[styles.section, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={24} color={themeStyles.buttonBackground} />
            <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Membros da Família</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchFamilyMembers}
              disabled={memberLoading}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={memberLoading ? themeStyles.secondaryText : themeStyles.buttonBackground}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeStyles.text }]}>Adicionar Membro</Text>
            <TextInput
              style={[styles.input, { borderColor: themeStyles.border, backgroundColor: themeStyles.cardBackground, color: themeStyles.text }]}
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="Nome do membro"
              placeholderTextColor={themeStyles.secondaryText}
              maxLength={50}
              editable={!memberLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeStyles.buttonBackground }, memberLoading && styles.disabledButton]}
            onPress={handleAddMember}
            disabled={memberLoading || !newMemberName.trim()}
            activeOpacity={0.8}
          >
            {memberLoading ? (
              <ActivityIndicator size="small" color={themeStyles.buttonText} />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color={themeStyles.buttonText} />
                <Text style={[styles.buttonText, { color: themeStyles.buttonText }]}>Adicionar Membro</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.membersList}>
            {memberLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={themeStyles.buttonBackground} />
                <Text style={[styles.loadingText, { color: themeStyles.secondaryText }]}>Carregando membros...</Text>
              </View>
            ) : familyMembers.length === 0 ? (
              <Text style={[styles.emptyText, { color: themeStyles.secondaryText }]}>
                Nenhum membro adicionado ainda.{'\n'}Adicione membros para começar a atribuir tarefas!
              </Text>
            ) : (
              <>
                <Text style={[styles.membersCount, { color: themeStyles.secondaryText }]}>
                  {familyMembers.length} {familyMembers.length === 1 ? 'membro' : 'membros'}
                </Text>
                {familyMembers.map((member) => (
                  <View key={member.id} style={[styles.memberItem, { borderBottomColor: themeStyles.border }]}>
                    <View style={styles.memberInfo}>
                      <MaterialCommunityIcons name="account" size={20} color={themeStyles.buttonBackground} />
                      <Text style={[styles.memberName, { color: themeStyles.text }]}>{member.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteMember(member.id, member.name)}
                      style={[styles.deleteButton, { backgroundColor: themeStyles.deleteButton + '20' }]}
                      accessibilityLabel={`Remover ${member.name}`}
                    >
                      <MaterialCommunityIcons name="delete" size={18} color={themeStyles.deleteButton} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-cog" size={24} color={themeStyles.buttonBackground} />
            <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Conta</Text>
          </View>

          {user && (
            <View style={styles.userInfo}>
              <Text style={[styles.userLabel, { color: themeStyles.secondaryText }]}>Usuário logado:</Text>
              <Text style={[styles.userEmail, { color: themeStyles.text }]}>{user.email}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.signOutButton, { backgroundColor: themeStyles.deleteButton }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            <Text style={[styles.buttonText, { color: '#fff' }]}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  themeButton: {
    padding: 8,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  signOutButton: {
    marginTop: 16,
  },
  membersList: {
    marginTop: 16,
  },
  membersCount: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    paddingVertical: 16,
  },
  userInfo: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
});