import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard () {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { user, signOut, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
              // Não precisa navegar manualmente - o AuthContext vai lidar com isso
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            } finally {
              setIsLoggingOut(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const tasks = [
    { id: 1, title: 'Lavar roupa', done: true },
    { id: 2, title: 'Levar lixo', done: false },
    { id: 3, title: 'Comprar frutas', done: false },
  ];

  const gastos = [
    { x: 'Fixos', y: 40 },
    { x: 'Variáveis', y: 30 },
    { x: 'Lazer', y: 20 },
    { x: 'Outros', y: 10 },
  ];

  // Mostrar loading se estiver fazendo logout ou carregando
  if (loading && !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Carregando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>
                Casa em Dia
              </Text>
              <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
                Gerencie sua casa de forma inteligente
              </Text>
            </View>

            {/* Botão de Logout */}
            <TouchableOpacity
              style={[
                styles.logoutButton,
                { backgroundColor: `${theme.tint}15` },
                (isLoggingOut || loading) && styles.buttonDisabled
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={isLoggingOut || loading}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={theme.tint}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Info do usuário */}
          {user && (
            <View style={styles.userInfo}>
              <MaterialCommunityIcons
                name="account-circle"
                size={16}
                color={theme.tabIconDefault}
              />
              <Text style={[styles.userEmail, { color: theme.tabIconDefault }]}>
                {user.email}
              </Text>
            </View>
          )}
        </View>

        {/* Card de Saldo e Gastos */}
        <View style={[styles.balanceCard, { backgroundColor: theme.tint }]}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceHeaderContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="cash" color={isDark ? "#000" : "#fff"} size={24} />
              </View>
              <Text style={[styles.balanceLabel, { color: isDark ? "#000" : "#fff" }]}>
                Saldo Conjunto
              </Text>
            </View>
          </View>

          <Text style={[styles.balanceAmount, { color: isDark ? "#000" : "#fff" }]}>
            R$ 3.250,00
          </Text>

          <View style={[styles.balanceDetails, { borderTopColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)' }]}>
            <View style={styles.expenseRow}>
              <Text style={[styles.expenseLabel, { color: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>Gastos do mês</Text>
              <Text style={[styles.expenseAmount, { color: isDark ? "#000" : "#fff" }]}>R$ 1.820,00</Text>
            </View>

            <View style={styles.lastExpenseRow}>
              <View style={[styles.expenseIndicator, { backgroundColor: isDark ? '#FF7043' : '#FFA726' }]} />
              <Text style={[styles.lastExpenseText, { color: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
                Último gasto: João pagou R$ 200 - Luz
              </Text>
            </View>
          </View>
        </View>

        {/* Seção de Tarefas */}
        <View style={[styles.tasksCard, { backgroundColor: theme.background }]}>
          {/* Header da seção */}
          <View style={styles.tasksHeader}>
            <View style={styles.tasksHeaderContent}>
              <View style={[styles.tasksIconContainer, { backgroundColor: `${theme.tint}20` }]}>
                <FontAwesome5 name="tasks" color={theme.tint} size={20} />
              </View>
              <Text style={[styles.tasksTitle, { color: theme.text }]}>
                Tarefas de hoje
              </Text>
            </View>
            <Text style={[styles.tasksPending, { color: theme.tint }]}>
              {tasks.filter(task => !task.done).length} pendentes
            </Text>
          </View>

          {/* Lista de Tarefas */}
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.done ? theme.tint : theme.tabIconDefault,
                      backgroundColor: task.done ? theme.tint : 'transparent',
                    }
                  ]}
                >
                  {task.done && (
                    <MaterialCommunityIcons name="check" color={isDark ? "#000" : "#fff"} size={14} />
                  )}
                </View>

                <Text
                  style={[
                    styles.taskText,
                    {
                      textDecorationLine: task.done ? 'line-through' : 'none',
                      color: task.done ? theme.tabIconDefault : theme.text,
                    }
                  ]}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão Nova Tarefa */}
          <TouchableOpacity
            style={[styles.addTaskButton, { backgroundColor: theme.tint }]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" color={isDark ? "#000" : "#fff"} size={20} />
            <Text style={[styles.addTaskText, { color: isDark ? "#000" : "#fff" }]}>
              Nova tarefa
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 12,
    marginLeft: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceDetails: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseLabel: {
    fontSize: 14,
  },
  expenseAmount: {
    fontWeight: '600',
    fontSize: 14,
  },
  lastExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  lastExpenseText: {
    fontSize: 14,
    flex: 1,
  },
  tasksCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tasksIconContainer: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  tasksPending: {
    fontWeight: '500',
    fontSize: 14,
  },
  tasksList: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  addTaskButton: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskText: {
    textAlign: 'center',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});