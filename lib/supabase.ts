import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Use variáveis de ambiente para maior segurança
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Validação básica das URLs
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "X-Client-Info": "supabase-js-react-native",
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Função helper para lidar com erros do Supabase
export const handleSupabaseError = (error: any, context: string = "") => {
  console.error(`Supabase error ${context}:`, error);

  if (error?.message) {
    return error.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
};
