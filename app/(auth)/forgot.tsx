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
  View,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu e-mail.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        let errorMessage = 'Erro ao enviar e-mail de recuperação.';
        if (error.message.includes('User not found')) {
          errorMessage = 'E-mail não encontrado em nossa base de dados.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'E-mail inválido.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else {
          errorMessage = error.message;
        }
        Alert.alert('Erro', errorMessage);
      } else {
        Alert.alert(
          'E-mail enviado!',
          'Um link de recuperação foi enviado para seu e-mail. Verifique sua caixa de entrada e spam.',
          [
            {
              text: 'OK',
              onPress: () => setEmail(''),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.form}>
        <View style={styles.iconContainer}>
          <FontAwesome name="lock" color={Colors.light.primary} size={120} />
          <Text style={styles.title}>Recuperar Senha</Text>
        </View>
        <Text style={styles.subtitle}>
          Digite seu e-mail para receber um link de recuperação de senha
        </Text>

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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading && <ActivityIndicator size="small" color={Colors.light.textWhite} />}
          <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar Link'}</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.linkText, loading && styles.linkDisabled]}>Voltar ao login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: 'white',
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
      color: Colors.light.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      color: Colors.light.mutedText,
      lineHeight: 24,
      paddingHorizontal: 10,
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
      color: Colors.light.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    linkDisabled: {
      opacity: 0.5,
    },
  });
