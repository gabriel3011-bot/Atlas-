import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, these are process.env.REACT_APP_SUPABASE_URL etc.
// For this demo, we check if they exist. If not, the app will fall back to mock data
// within the components (handled in the service layer pattern).

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// To avoid "Error: supabaseUrl is required" when env vars are missing, we pass a placeholder.
// The app checks isSupabaseConfigured() before making actual requests.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};