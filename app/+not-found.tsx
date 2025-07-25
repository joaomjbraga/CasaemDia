import { Link, Stack } from 'expo-router';
import { StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';


export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ops! 😅' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Ícone ilustrativo */}
        <View style={[styles.iconContainer, { backgroundColor: `${theme.tint}15` }]}>
          <MaterialCommunityIcons 
            name="heart-broken" 
            size={80} 
            color={theme.tint} 
          />
        </View>

        {/* Título principal */}
        <Text style={[styles.title, { color: theme.text }]}>
          Houston, temos um problema! 🚀
        </Text>

        {/* Descrição cômica */}
        <Text style={[styles.description, { color: theme.tabIconDefault }]}>
          Parece que vocês se perderam navegando pela casa! 🏠
          {'\n\n'}
          Assim como quando um dos dois "tem certeza" de que conhece o caminho... 😄
        </Text>

        {/* Botão de retorno */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.tint }]}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="home-heart" 
            size={20} 
            color={isDark ? "#000" : "#fff"} 
          />
          <Text style={[styles.buttonText, { color: isDark ? "#000" : "#fff" }]}>
            Voltar para casa ❤️
          </Text>
        </TouchableOpacity>

        {/* Texto adicional com humor */}
        <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
          Prometo que não vou dizer "eu avisei" desta vez! 😉
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
    fontStyle: 'italic',
  },
});