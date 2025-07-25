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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        let errorMessage = 'Erro ao criar conta';
        
        if (error.message) {
          if (error.message.includes('User already registered')) {
            errorMessage = 'Este email já está cadastrado';
          } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Email inválido';
          } else {
            errorMessage = error.message;
          }
        }
        
        Alert.alert('Erro', errorMessage);
      } else {
        Alert.alert(
          'Conta criada com sucesso!',
          'Verifique seu email para ativar a conta antes de fazer login.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro inesperado no registro:', error);
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
      marginBottom: 40,
      color: colors.text,
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
          <FontAwesome name='user-plus' color={colors.tint} size={100} /> 
          <Text style={styles.title}>Criar Conta</Text>
        </View>
        
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
        
        <TextInput
          style={styles.input}
          placeholder="Senha (mín. 6 caracteres)"
          placeholderTextColor={colors.tabIconDefault}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          placeholderTextColor={colors.tabIconDefault}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.links}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                Já tem conta? Entrar
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}