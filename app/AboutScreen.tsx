import { View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export default function AboutScreen() {
  const router = useRouter();
  const themeName = useColorScheme() ?? 'light';
  const theme = Colors[themeName];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <Pressable style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.1)' }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.contentWrapper}>
          <View style={styles.iconContainer}>
            <Ionicons name="home" size={48} color={theme.tint} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Casa em Dia</Text>
          <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Organização doméstica sem estresse
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre o Casa em Dia</Text>
          <Text style={[styles.paragraph, { color: theme.tabIconDefault }]}>
            Casa em Dia é um aplicativo criado para ajudar casais e famílias a manterem a rotina da casa organizada. Ele combina tarefas domésticas com controle financeiro, tudo em um único lugar.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Funcionalidades principais</Text>
          {[
            'Controle de tarefas por membro da casa',
            'Sistema de pontuação por tarefas',
            'Organização e metas financeiras',
            'Compartilhamento de responsabilidades',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.tint} style={styles.featureIcon} />
              <Text style={[styles.paragraph, { color: theme.tabIconDefault }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Objetivo</Text>
          <Text style={[styles.paragraph, { color: theme.tabIconDefault }]}>
            Promover equilíbrio, colaboração e transparência na divisão das tarefas e no uso do dinheiro em casa.
          </Text>
        </View>

        <View style={styles.footerSection}>
          <Text style={[styles.footer, { color: theme.tabIconDefault }]}>
            Versão 1.0 • Desenvolvido por João Marcos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: Platform.select({ ios: 60, android: 40 }),
    left: 20,
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  contentWrapper: {
    alignItems: 'center',
    paddingTop: 100,
    marginBottom: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 8,
  },
  footerSection: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
  },
});
