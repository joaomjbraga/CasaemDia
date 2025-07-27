import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Dashboard() {
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
    { id: 1, title: 'Lavar roupa', done: true, assignee: 'Anne', points: 15 },
    { id: 2, title: 'Levar lixo', done: false, assignee: 'João', points: 10 },
    { id: 3, title: 'Comprar frutas', done: false, assignee: 'Anne', points: 8 },
    { id: 4, title: 'Limpar banheiro', done: true, assignee: 'João', points: 20 },
  ];

  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  // Estatísticas do casal
  const coupleStats = {
    maria: { name: 'Anne', points: 145, avatar: '👩🏻', tasksCompleted: 12 },
    joao: { name: 'João', points: 132, avatar: '👨🏻', tasksCompleted: 10 }
  };

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
     <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#F4CE14' : '#3E8E7E'}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com gradiente */}
        <LinearGradient
          colors={isDark ? ['#F4CE14', '#DAB700'] : ['#3E8E7E', '#2D6B5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="home-heart" size={28} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Casa em Dia</Text>
                <Text style={styles.headerSubtitle}>Sua casa, organizada</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut || loading}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {user && user.email && (
            <View style={styles.userWelcome}>
              <Text style={styles.welcomeText}>Olá, {user.email.split('@')[0]}! 👋</Text>
            </View>
          )}
        </LinearGradient>

        {/* Cards de estatísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? '#F4CE14' : '#3E8E7E' }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color={isDark ? '#1E1E1E' : '#FFFFFF'} />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>{completedTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Concluídas</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FF8C42' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>{totalTasks - completedTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Pendentes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#8E44AD' }]}>
              <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>277</Text>
            <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Pontos</Text>
          </View>
        </View>

        {/* Card de Saldo com design aprimorado */}
        <LinearGradient
          colors={isDark ? ['#F4CE14', '#DAB700'] : ['#3E8E7E', '#2D6B5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceHeaderContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="wallet" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={24} />
              </View>
              <Text style={[styles.balanceLabel, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>Saldo Conjunto</Text>
            </View>
            <TouchableOpacity style={[styles.balanceAction, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
              <MaterialCommunityIcons name="plus" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={20} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.balanceAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>R$ 2.250,00</Text>

          <View style={styles.balanceProgress}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
              <View style={[styles.progressFill, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', width: '65%' }]} />
            </View>
            <Text style={[styles.progressText, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>65% do orçamento mensal</Text>
          </View>

          <View style={[styles.balanceDetails, { borderTopColor: isDark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)' }]}>
            <View style={styles.expenseRow}>
              <Text style={[styles.expenseLabel, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>Gastos do mês</Text>
              <Text style={[styles.expenseAmount, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>R$ 1.462,50</Text>
            </View>
            <View style={styles.lastExpenseRow}>
              <View style={[styles.expenseIndicator, { backgroundColor: isDark ? '#FF8C42' : '#22c55e' }]} />
              <Text style={[styles.lastExpenseText, { color: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                João pagou R$ 200 - Conta de Luz ⚡
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Ranking do Casal */}
        <View style={[styles.rankingCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: isDark ? '#F4CE1440' : '#3E8E7E40' }]}>
                <MaterialCommunityIcons name="trophy" color={theme.tint} size={20} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ranking do Mês</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: theme.tabIconDefault }]}>🔥 7 dias</Text>
          </View>

          <View style={styles.rankingList}>
            <View style={[styles.rankingItem, styles.rankingFirst, { backgroundColor: isDark ? '#F4CE1420' : '#3E8E7E20', borderColor: theme.tint }]}>
              <View style={styles.rankingLeft}>
                <View style={[styles.rankingPosition, { backgroundColor: theme.tint }]}>
                  <Text style={[styles.positionText, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>1º</Text>
                </View>
                <Text style={styles.rankingAvatar}>{coupleStats.maria.avatar}</Text>
                <Text style={[styles.rankingName, { color: theme.text }]}>{coupleStats.maria.name}</Text>
              </View>
              <View style={styles.rankingRight}>
                <Text style={[styles.rankingPoints, { color: theme.tint }]}>{coupleStats.maria.points} pts</Text>
              </View>
            </View>

            <View style={styles.rankingItem}>
              <View style={styles.rankingLeft}>
                <View style={[styles.rankingPosition, { backgroundColor: '#8E8E8E' }]}>
                  <Text style={[styles.positionText, { color: '#FFFFFF' }]}>2º</Text>
                </View>
                <Text style={styles.rankingAvatar}>{coupleStats.joao.avatar}</Text>
                <Text style={[styles.rankingName, { color: theme.text }]}>{coupleStats.joao.name}</Text>
              </View>
              <View style={styles.rankingRight}>
                <Text style={[styles.rankingPoints, { color: theme.tabIconDefault }]}>{coupleStats.joao.points} pts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seção de Tarefas Aprimorada */}
        <View style={[styles.tasksCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: '#8E44AD20' }]}>
                <FontAwesome5 name="tasks" color="#8E44AD" size={16} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tarefas de Hoje</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: theme.tint }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de progresso das tarefas */}
          <View style={styles.taskProgress}>
            <View style={[styles.taskProgressBar, { backgroundColor: isDark ? '#3A3A3A' : '#F0F0F0' }]}>
              <View style={[styles.taskProgressFill, { width: `${progressPercentage}%`, backgroundColor: '#8E44AD' }]} />
            </View>
            <Text style={[styles.taskProgressText, { color: theme.tabIconDefault }]}>
              {completedTasks} de {totalTasks} concluídas ({Math.round(progressPercentage)}%)
            </Text>
          </View>

          {/* Lista de Tarefas */}
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  { backgroundColor: isDark ? '#3A3A3A' : '#F8F9FA' }
                ]}
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
                    <MaterialCommunityIcons name="check" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={14} />
                  )}
                </View>

                <View style={styles.taskContent}>
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
                  <View style={styles.taskMeta}>
                    <Text style={[styles.taskAssignee, { color: theme.tabIconDefault }]}>
                      {task.assignee}
                    </Text>
                    <View style={styles.taskPoints}>
                      <MaterialCommunityIcons name="star" size={12} color="#FF8C42" />
                      <Text style={[styles.taskPointsText, { color: '#FF8C42' }]}>
                        {task.points} pts
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addTaskButton, { backgroundColor: theme.tint }]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" color={isDark ? '#1E1E1E' : '#FFFFFF'} size={18} />
              <Text style={[styles.addTaskText, { color: isDark ? '#1E1E1E' : '#FFFFFF' }]}>Nova Tarefa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.tabIconDefault }]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar" color={theme.tabIconDefault} size={18} />
              <Text style={[styles.secondaryButtonText, { color: theme.tabIconDefault }]}>
                Agendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={[styles.quickActions, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
            Ações Rápidas
          </Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: isDark ? '#F4CE1420' : '#3E8E7E20' }]}>
              <MaterialCommunityIcons name="cart-plus" size={24} color={theme.tint} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Lista de Compras</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#3b82f620' }]}>
              <MaterialCommunityIcons name="target" size={24} color="#3b82f6" />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Metas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#FF8C4220' }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#FF8C42" />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Relatórios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: '#8E44AD20' }]}>
              <MaterialCommunityIcons name="cog" size={24} color="#8E44AD" />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingBottom: 24,
  },

  // Header com gradiente
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  userWelcome: {
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 24,
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceAction: {
    padding: 8,
    borderRadius: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceProgress: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
  },
  balanceDetails: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseLabel: {
    fontSize: 14,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 13,
    flex: 1,
  },

  // Ranking Card
  rankingCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankingList: {
    marginTop: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankingFirst: {
    borderWidth: 1,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingPosition: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankingAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Tasks Card
  tasksCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskProgress: {
    marginBottom: 20,
  },
  taskProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tasksList: {
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskAssignee: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskPointsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addTaskButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addTaskText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },

  // Quick Actions
  quickActions: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});