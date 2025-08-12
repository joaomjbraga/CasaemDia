import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any; success: boolean }>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error: any; success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao obter sessão:', error);
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setInitialized(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (!initialized) {
            setInitialized(true);
          }
          if (loading) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Tentando fazer login com:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Erro no login do Supabase:', error.message);
        return {
          error,
          success: false,
          data: null
        };
      }

      // Verificar se realmente temos um usuário autenticado
      if (!data.user || !data.session) {
        console.error('Login falhou: Nenhum usuário ou sessão retornado');
        return {
          error: { message: 'Falha na autenticação. Usuário não encontrado.' },
          success: false,
          data: null
        };
      }

      // Verificar se o e-mail do usuário corresponde ao que foi digitado
      if (data.user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        console.error('Login falhou: E-mail não corresponde');
        return {
          error: { message: 'Erro na autenticação. E-mail não corresponde.' },
          success: false,
          data: null
        };
      }

      console.log('Login realizado com sucesso:', data.user.email);

      // Forçar atualização do estado local
      setSession(data.session);
      setUser(data.user);

      return {
        error: null,
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return {
        error,
        success: false,
        data: null
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Tentando criar conta com:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined, // Não necessário, pois confirmação de e-mail está desativada
        },
      });

      if (error) {
        console.error('Erro no registro do Supabase:', error.message);
        return {
          error,
          success: false,
          data: null
        };
      }

      // Verificar se o usuário foi criado
      if (!data.user) {
        console.error('Registro falhou: Nenhum usuário criado');
        return {
          error: { message: 'Falha ao criar conta. Tente novamente.' },
          success: false,
          data: null
        };
      }

      console.log('Registro realizado:', data.user.email);

      // Se o usuário foi criado mas não está logado automaticamente, fazer login
      if (!data.session) {
        console.log('Fazendo login automático após registro...');
        const loginResult = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (loginResult.error) {
          console.error('Erro no login automático:', loginResult.error);
          return {
            error: loginResult.error,
            success: false,
            data: null
          };
        }

        // Atualizar dados com a sessão do login
        setSession(loginResult.data.session);
        setUser(loginResult.data.user);

        return {
          error: null,
          success: true,
          data: loginResult.data
        };
      }

      // Se já veio com sessão, atualizar o estado
      setSession(data.session);
      setUser(data.user);

      return {
        error: null,
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro inesperado no registro:', error);
      return {
        error,
        success: false,
        data: null
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }

      // Limpar estado local imediatamente
      setSession(null);
      setUser(null);

      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );

      if (error) {
        console.error('Erro ao resetar senha:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro inesperado ao resetar senha:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        initialized,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};