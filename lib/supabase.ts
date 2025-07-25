import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ixuwefpjsknkeulbctmv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dXdlZnBqc2tua2V1bGJjdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTgyOTgsImV4cCI6MjA2ODk5NDI5OH0.IigsIL843pfOVEHGeoS8_r7Nc6FUGcHFXTMLFFlTZIw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})