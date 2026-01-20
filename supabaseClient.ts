import { createClient } from '@supabase/supabase-js';

// Credenciais do Projeto Atlas 2026
const SUPABASE_URL = 'https://bblmehkibwzzhsfuuqjw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibG1laGtpYnd6emhzZnV1cWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODU2NzYsImV4cCI6MjA4MzY2MTY3Nn0.mXvFjK3zLkx8PVLfH4Uuq5XCYuTKY4MAV0t6StfvAvk';

console.log("Iniciando conexão com Supabase...", { url: SUPABASE_URL });

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = () => {
  return true;
};