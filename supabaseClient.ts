
import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acessar variáveis de ambiente de forma segura
const getEnv = (key: string) => {
  // Tenta acessar via import.meta.env (Vite)
  // O optional chaining (?.) previne o erro se .env for undefined
  // @ts-ignore
  const viteEnv = import.meta.env?.[key];
  if (viteEnv) return viteEnv;

  // Tenta acessar via process.env (Legado/Webpack/Jest)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignora erro de referência
  }

  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

console.log("Iniciando Supabase...", { 
  url: supabaseUrl ? "OK (Encontrada)" : "ERRO (Faltando - Modo Offline)",
  key: supabaseAnonKey ? "OK (Encontrada)" : "ERRO (Faltando - Modo Offline)"
});

// Cria um cliente seguro. Se as chaves faltarem, ele não trava o site (tela preta),
// apenas desativa o banco de dados.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
};
