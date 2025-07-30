import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
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
  useColorScheme,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      backgroundColor: colors.background + 'CC', // Adiciona opacidade ao fundo
      justifyContent: 'center',
      padding: 20,
    },
    form: {
      width: '100%',
    },
    title: {
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
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    <ImageBackground
      source={require('@/assets/images/background-login.jpg')}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <FontAwesome name="user-circle" color={colors.tint} size={100} />
            <Text style={styles.title}>Entrar</Text>
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
            placeholder="Senha"
            placeholderTextColor={colors.tabIconDefault}
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
            {loading && <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000' : '#FFFFFF'} />}
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