
import { createClient } from '@supabase/supabase-js';

const getSafeEnv = (key: string): string => {
  try {
    // Tenta as várias formas de acessar variáveis de ambiente
    const value = (import.meta as any).env?.[`VITE_${key}`] || 
                  (typeof process !== 'undefined' ? process.env[key] : null);
    return value || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getSafeEnv('SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('SUPABASE_ANON_KEY');

// Fallback para URLs seguras que não quebram o construtor do Supabase
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey);

export const isSupabaseConfigured = () => {
  return supabaseUrl.startsWith('http') && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
};
