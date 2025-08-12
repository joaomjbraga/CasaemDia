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
  View
} from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { signUp } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (pwd: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasMinLength = pwd.length >= 6;
    return hasMinLength && hasLetter && hasNumber;
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

    // Also check confirm password when password changes
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
    } else if (confirmPasswordError && text === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);

    if (text !== password) {
      setConfirmPasswordError('As senhas não coincidem');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleRegister = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

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
    } else if (!validatePassword(password)) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres, incluindo letras e números');
      hasErrors = true;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Confirmação de senha é obrigatória');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando tentativa de registro...');
      const result = await signUp(email, password);

      if (!result.success || result.error) {
        const error = result.error;
        console.error('Registro falhou:', error?.message || 'Erro desconhecido');

        let errorMessage = 'Erro ao criar conta. Tente novamente.';

        if (error?.message) {
          if (error.message.includes('User already registered') ||
            error.message.includes('already been registered')) {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
          } else if (error.message.includes('Password should be at least') ||
            error.message.includes('Password too short')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
          } else if (error.message.includes('Invalid email') ||
            error.message.includes('Email not valid')) {
            errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
          } else if (error.message.includes('Signup disabled')) {
            errorMessage = 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
          } else if (error.message.includes('Network') ||
            error.message.includes('network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          }
        }

        Alert.alert('Erro no Cadastro', errorMessage);
        return;
      }

      // Verificar se temos dados do usuário
      if (!result.data?.user?.email) {
        console.error('Registro falhou: Nenhum dado de usuário retornado');
        Alert.alert('Erro no Cadastro', 'Falha ao criar conta. Tente novamente.');
        return;
      }

      console.log('Registro bem-sucedido para:', result.data.user.email);
      Alert.alert(
        'Conta criada com sucesso!',
        'Sua conta foi criada e você foi logado automaticamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro inesperado no registro:', error);
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
      style={styles.backgroundImage}
      source={require('@/assets/images/capa2.jpg')}
    >
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.form}>
          <Text style={styles.title}>Criar Conta</Text>

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
              placeholder="Senha (mín. 6 caracteres, letras e números)"
              placeholderTextColor={Colors.light.mutedText}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
              returnKeyType="next"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                confirmPasswordError ? styles.inputError : null
              ]}
              placeholder="Confirmar Senha"
              placeholderTextColor={Colors.light.mutedText}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

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
                <Text style={[styles.linkText, loading && styles.linkDisabled]}>
                  Já tem conta? Entrar
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
  container: {
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
    borderRadius: 16,
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
    padding: 7,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  linkDisabled: {
    opacity: 0.5,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover'
  }
});