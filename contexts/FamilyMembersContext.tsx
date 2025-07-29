import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface FamilyMember {
  id: number;
  name: string;
}

interface FamilyMembersContextType {
  familyMembers: FamilyMember[];
  fetchFamilyMembers: () => Promise<void>;
  addFamilyMember: (name: string) => Promise<void>;
  deleteFamilyMember: (id: number) => Promise<void>;
  loading: boolean;
}

const FamilyMembersContext = createContext<FamilyMembersContextType | undefined>(undefined);

export const FamilyMembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFamilyMembers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('FamilyMembersContext: Starting fetchFamilyMembers');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('FamilyMembersContext: Authentication error:', sessionError);
        throw new Error('Usuário não autenticado');
      }

      const userId = sessionData.session.user.id;
      console.log('FamilyMembersContext: Fetching family members for user_id:', userId);
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        console.error('FamilyMembersContext: Fetch family members error:', error);
        throw error;
      }

      console.log('FamilyMembersContext: Fetched family members:', data);
      setFamilyMembers([...(data || [])]); // Forçar nova referência para reatividade
    } catch (error: any) {
      console.error('FamilyMembersContext: Error fetching family members:', error);
      Alert.alert('Erro', 'Falha ao carregar membros da família: ' + error.message);
    } finally {
      setLoading(false);
      console.log('FamilyMembersContext: fetchFamilyMembers completed');
    }
  }, []);

  const addFamilyMember = useCallback(async (name: string) => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do membro da família.');
      return;
    }
    if (familyMembers.some((member) => member.name.toLowerCase() === name.trim().toLowerCase())) {
      Alert.alert('Erro', 'Já existe um membro com esse nome.');
      return;
    }
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const userId = sessionData.session.user.id;
      console.log('FamilyMembersContext: Adding family member with user_id:', userId, 'name:', name.trim());
      const { error } = await supabase
        .from('family_members')
        .insert({ user_id: userId, name: name.trim() });

      if (error) throw error;

      await fetchFamilyMembers(); // Atualizar após inserção
      Alert.alert('Sucesso', 'Membro da família adicionado com sucesso!');
    } catch (error: any) {
      console.error('FamilyMembersContext: Error adding family member:', error);
      Alert.alert('Erro', 'Falha ao adicionar membro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [familyMembers, fetchFamilyMembers]);

  const deleteFamilyMember = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const userId = sessionData.session.user.id;
      console.log('FamilyMembersContext: Checking tasks for member_id:', id);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('assignee_id', id);

      if (tasksError) throw tasksError;

      if (tasksData && tasksData.length > 0) {
        Alert.alert('Erro', 'Não é possível remover este membro, pois ele tem tarefas atribuídas.');
        return;
      }

      console.log('FamilyMembersContext: Deleting family member with id:', id);
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;

      await fetchFamilyMembers(); // Atualizar após remoção
      Alert.alert('Sucesso', 'Membro da família removido com sucesso!');
    } catch (error: any) {
      console.error('FamilyMembersContext: Error deleting family member:', error);
      Alert.alert('Erro', 'Falha ao remover membro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFamilyMembers]);

  useEffect(() => {
    console.log('FamilyMembersContext: Initializing useEffect');
    fetchFamilyMembers();

    const channelName = `family_members_context_${Date.now()}`;
    console.log('FamilyMembersContext: Subscribing to channel:', channelName);
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_members',
        },
        (payload) => {
          console.log('FamilyMembersContext: Real-time INSERT event:', payload);
          fetchFamilyMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_members',
        },
        (payload) => {
          console.log('FamilyMembersContext: Real-time UPDATE event:', payload);
          fetchFamilyMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'family_members',
        },
        (payload) => {
          console.log('FamilyMembersContext: Real-time DELETE event:', payload);
          fetchFamilyMembers();
        }
      )
      .subscribe((status, error) => {
        console.log('FamilyMembersContext: Subscription status:', status);
        if (error) {
          console.error('FamilyMembersContext: Subscription error:', error);
          Alert.alert('Erro', 'Falha na subscrição em tempo real: ' + error.message);
        }
      });

    return () => {
      console.log('FamilyMembersContext: Unsubscribing from channel:', channelName);
      supabase.removeChannel(subscription);
    };
  }, [fetchFamilyMembers]);

  return (
    <FamilyMembersContext.Provider value={{ familyMembers, fetchFamilyMembers, addFamilyMember, deleteFamilyMember, loading }}>
      {children}
    </FamilyMembersContext.Provider>
  );
};

export const useFamilyMembers = () => {
  const context = useContext(FamilyMembersContext);
  if (!context) {
    throw new Error('useFamilyMembers must be used within a FamilyMembersProvider');
  }
  return context;
};