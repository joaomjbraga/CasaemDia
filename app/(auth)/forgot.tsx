import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        let errorMessage = 'Erro ao enviar email de recuperação';
        
        if (error.message) {
          if (error.message.includes('User not found')) {
            errorMessage = 'Email não encontrado em nossa base de dados';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Email inválido';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Muitas tentativas. Aguarde alguns minutos';
          } else {
            errorMessage = error.message;
          }
        }
        
        Alert.alert('Erro', errorMessage);
      } else {
        Alert.alert(
          'Email enviado!',
          'Um link de recuperação foi enviado para seu email. Verifique sua caixa de entrada e spam.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setEmail('');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error);
      Alert.alert('Erro', 'Erro inesperado. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    form: {
      width: '100%',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      color: colors.tabIconDefault,
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 20,
      fontSize: 16,
      backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F8F8F8',
      color: colors.text,
    },
    button: {
      height: 50,
      backgroundColor: colors.tint,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: colors.tint,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colorScheme === 'dark' ? '#000' : '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    links: {
      alignItems: 'center',
    },
    linkText: {
      color: colors.tint,
      fontSize: 16,
      fontWeight: '500',
    },
    linkDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>

        <View style={{alignItems: 'center', justifyContent: 'center', gap: 10}}>
          <FontAwesome name='bug' color={colors.tint} size={100} /> 
          <Text style={styles.title}>Recuperar Senha</Text>
        </View>
        <Text style={styles.subtitle}>
          Digite seu email para receber um link de recuperação de senha
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.tabIconDefault}
          value={email}
          onChangeText={(text) => setEmail(text.trim())}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enviando...' : 'Enviar Link'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.links}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                Voltar ao login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}