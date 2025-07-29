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
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function SettingsScreen () {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [monthlyBudget, setMonthlyBudget] = useState<string>('0,00');
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const themeStyles = isDark
    ? {
        background: '#000',
        cardBackground: '#262626',
        text: '#E0E0E0',
        secondaryText: '#A0A0A0',
        border: '#3A4445',
        buttonBackground: '#C9F31D',
        buttonBorder: '#9AB821',
        buttonText: '#010101',
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
      };

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const userId = sessionData.session.user.id;
      const { data, error } = await supabase
        .from('balances')
        .select('monthly_budget')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMonthlyBudget(data.monthly_budget?.toFixed(2).replace('.', ',') || '0,00');
      } else {
        const { error: insertError } = await supabase
          .from('balances')
          .insert({
            user_id: userId,
            total_balance: 0,
            monthly_budget: 0,
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao carregar orçamento: ' + error.message);
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async () => {
    try {
      setSaveLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const userId = sessionData.session.user.id;
      const budgetValueString = monthlyBudget.replace(',', '.');
      const budgetValue = parseFloat(budgetValueString);

      if (isNaN(budgetValue) || budgetValue < 0) {
        throw new Error('Por favor, insira um valor válido para o orçamento (ex.: 1234,56)');
      }

      const { error } = await supabase
        .from('balances')
        .upsert(
          {
            user_id: userId,
            monthly_budget: budgetValue,
            total_balance: 0,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      Alert.alert('Sucesso', 'Orçamento atualizado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao atualizar orçamento: ' + error.message);
      console.error('Error updating balance:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeStyles.background }]}>
        <ActivityIndicator size="large" color={themeStyles.buttonBackground} />
        <Text style={[styles.loadingText, { color: themeStyles.secondaryText }]}>
          Carregando configurações...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={[styles.header, { backgroundColor: themeStyles.buttonBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)')}
          accessibilityLabel="Voltar para a tela inicial"
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
        <View style={[styles.section, { backgroundColor: themeStyles.cardBackground, borderColor: themeStyles.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color={themeStyles.buttonBackground} />
            <Text style={[styles.sectionTitle, { color: themeStyles.text }]}>Finanças</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeStyles.text }]}>Orçamento Mensal</Text>
            <TextInput
              style={[styles.input, { borderColor: themeStyles.border, backgroundColor: themeStyles.cardBackground, color: themeStyles.text }]}
              value={monthlyBudget}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9,]/g, '');
                if (/^\d+,\d{0,2}$|^$/.test(cleaned)) {
                  setMonthlyBudget(cleaned);
                }
              }}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={themeStyles.secondaryText}
            />
            <Text style={[styles.currency, { color: themeStyles.secondaryText }]}>R$</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeStyles.buttonBackground }, saveLoading && styles.disabledButton]}
            onPress={updateBalance}
            disabled={saveLoading}
            activeOpacity={0.8}
          >
            {saveLoading ? (
              <ActivityIndicator size="small" color={themeStyles.buttonText} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color={themeStyles.buttonText} />
                <Text style={[styles.buttonText, { color: themeStyles.buttonText }]}>
                  Salvar Orçamento
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

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
  },
  themeButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 16,
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
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
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
  currency: {
    position: 'absolute',
    right: 14,
    top: 42,
    fontSize: 16,
    fontWeight: '500',
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
});