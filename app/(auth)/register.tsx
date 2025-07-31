import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert, ImageBackground, KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

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

  return (
    <ImageBackground
      style={styles.backgroudimage}
      source={require('@/assets/images/capa2.jpg')}
    >
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.form}>
          <Text style={styles.title}>Criar Conta</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={Colors.light.mutedText}
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
          placeholderTextColor={Colors.light.mutedText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          placeholderTextColor={Colors.light.mutedText}
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
          {loading && <ActivityIndicator size="small" color={Colors.light.textWhite} />}
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
    </ImageBackground>
  );
}


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    form: {
      width: '100%',
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
      gap: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#faf7fb',
      backgroundColor: 'black',
      borderRadius: 6,
      marginBottom: 24
    },
    input: {
      height: 55,
      borderWidth: 2,
      borderColor: Colors.light.border,
      borderRadius: 16,
      paddingHorizontal: 20,
      marginBottom: 20,
      fontSize: 16,
      backgroundColor: Colors.light.cardBackground,
      color: Colors.light.text,
      shadowColor: Colors.light.accentBlue,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    button: {
      height: 55,
      backgroundColor: Colors.light.primary,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: Colors.light.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      flexDirection: 'row',
      gap: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: Colors.light.textWhite,
      fontSize: 18,
      fontWeight: '700',
    },
    links: {
      alignItems: 'center',
    },
    linkText: {
      color: Colors.light.textWhite,
      fontSize: 16,
      fontWeight: '600',
      padding: 7,
      borderRadius: 5,
      backgroundColor: 'black'
    },
    linkDisabled: {
      opacity: 0.5,
    },
    backgroudimage: {
      flex: 1,
      resizeMode: 'cover'
    }
  });
