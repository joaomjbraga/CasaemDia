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
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        let errorMessage = 'Erro ao fazer login.';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-mail ou senha incorretos.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else {
          errorMessage = error.message;
        }
        Alert.alert('Erro', errorMessage);
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
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
            placeholder="Senha"
            placeholderTextColor={Colors.light.mutedText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
          />

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
            <Link href="/(auth)/forgot" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.linkText, loading && styles.linkDisabled]}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={[styles.linkText, loading && styles.linkDisabled]}>Criar conta</Text>
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
      borderRadius: 30,
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
    inputFocused: {
      borderColor: Colors.light.primary,
      shadowOpacity: 0.2,
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    linkText: {
      color: Colors.light.textWhite,
      fontSize: 16,
      fontWeight: '600',
    },
    linkDisabled: {
      opacity: 0.5,
    },
  });
