
import { createClient } from '@supabase/supabase-js';

// Proteção contra crash em ambientes sem process.env (Vite/ESM)
const getEnv = (key: string) => {
  try {
    // Tenta obter de process.env (Node/Webpack) ou import.meta.env (Vite)
    return (typeof process !== 'undefined' && process.env ? process.env[key] : null) 
      || (import.meta as any).env?.[`VITE_${key}`] 
      || null;
  } catch (e) {
    return null;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Placeholder para evitar erro de inicialização se as chaves estiverem vazias
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
};