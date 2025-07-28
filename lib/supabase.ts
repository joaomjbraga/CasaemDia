import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Use variáveis de ambiente para maior segurança
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ixuwefpjsknkeulbctmv.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dXdlZnBqc2tua2V1bGJjdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTgyOTgsImV4cCI6MjA2ODk5NDI5OH0.IigsIL843pfOVEHGeoS8_r7Nc6FUGcHFXTMLFFlTZIw'

// Validação básica das URLs
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required')
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
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Função helper para lidar com erros do Supabase
export const handleSupabaseError = (error: any, context: string = '') => {
  console.error(`Supabase error ${context}:`, error)

  if (error?.message) {
    return error.message
  }

  return 'Ocorreu um erro inesperado. Tente novamente.'
}