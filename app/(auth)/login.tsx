import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    const trimmedText = text.trim();
    setEmail(trimmedText);

    if (emailError && trimmedText) {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);

    if (passwordError && text) {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    let hasErrors = false;

    // Validate email
    if (!email) {
      setEmailError('E-mail é obrigatório');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Por favor, insira um e-mail válido');
      hasErrors = true;
    }

    // Validate password
    if (!password) {
      setPasswordError('Senha é obrigatória');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando tentativa de login...');
      const result = await signIn(email, password);

      // Verificar se o login foi realmente bem-sucedido
      if (!result.success || result.error) {
        const error = result.error;
        console.error('Login falhou:', error?.message || 'Erro desconhecido');

        let errorMessage = 'E-mail ou senha incorretos.';

        // Handle specific error cases
        if (error?.message) {
          if (error.message.includes('Invalid login credentials') ||
            error.message.includes('Invalid email or password') ||
            error.message.includes('invalid_credentials')) {
            errorMessage = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
          } else if (error.message.includes('Email not confirmed') ||
            error.message.includes('email_not_confirmed')) {
            errorMessage = 'E-mail não confirmado. Verifique seu e-mail para confirmar a conta.';
          } else if (error.message.includes('Too many requests') ||
            error.message.includes('rate limit')) {
            errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
          } else if (error.message.includes('Network') ||
            error.message.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (error.message.includes('User not found') ||
            error.message.includes('user_not_found')) {
            errorMessage = 'Usuário não encontrado. Verifique o e-mail ou crie uma nova conta.';
          } else if (error.message.includes('Falha na autenticação') ||
            error.message.includes('Usuário não encontrado')) {
            errorMessage = error.message;
          }
        }

        Alert.alert('Erro no Login', errorMessage);
        return;
      }

      // Verificação adicional: confirmar se temos dados do usuário
      if (!result.data?.user?.email) {
        console.error('Login falhou: Nenhum dado de usuário retornado');
        Alert.alert('Erro no Login', 'Falha na autenticação. Tente novamente.');
        return;
      }

      // Verificar se o e-mail corresponde
      if (result.data.user.email.toLowerCase() !== email.toLowerCase()) {
        console.error('Login falhou: E-mail não corresponde');
        Alert.alert('Erro no Login', 'Erro na autenticação. Dados inconsistentes.');
        return;
      }

      console.log('Login bem-sucedido para:', result.data.user.email);
      // Success case - navigation is handled by AuthContext state change
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      Alert.alert(
        'Erro Inesperado',
        'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/capa.jpg')}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Entrar</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                emailError ? styles.inputError : null
              ]}
              placeholder="E-mail"
              placeholderTextColor={Colors.light.mutedText}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              returnKeyType="next"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                passwordError ? styles.inputError : null
              ]}
              placeholder="Senha"
              placeholderTextColor={Colors.light.mutedText}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading && <ActivityIndicator size="small" color={Colors.light.textWhite} />}
            <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.links}>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                  Não tem conta? Criar conta
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#faf7fb',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 30,
    marginBottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 55,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 20,
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
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    height: 55,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    textAlign: 'center',
  },
  linkDisabled: {
    opacity: 0.5,
  },
});