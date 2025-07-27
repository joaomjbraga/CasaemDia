import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const validatePassword = (pwd: string) => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    return pwd.length >= 6 && hasLetter && hasNumber;
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres, incluindo letras e números.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        let errorMessage = 'Erro ao criar conta.';
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este e-mail já está cadastrado.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'E-mail inválido.';
        } else {
          errorMessage = error.message;
        }
        Alert.alert('Erro', errorMessage);
      } else {
        Alert.alert(
          'Conta criada com sucesso!',
          'Você foi logado automaticamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro inesperado no registro:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
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
      flexDirection: 'row',
      gap: 8,
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.form}>
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <FontAwesome name="user-plus" color={colors.tint} size={100} />
          <Text style={styles.title}>Criar Conta</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
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
          placeholder="Senha (mín. 6 caracteres, letras e números)"
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
          {loading && <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000' : '#FFFFFF'} />}
          <Text style={styles.buttonText}>{loading ? 'Criando conta...' : 'Criar Conta'}</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>Já tem conta? Entrar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}