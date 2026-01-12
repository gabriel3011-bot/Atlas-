import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Valida se o usuário logado está autorizado a acessar o sistema
 * @param supabase - Cliente Supabase
 * @param userEmail - E-mail do usuário autenticado
 * @returns boolean - true se autorizado, false caso contrário
 */
export const validarAcessoUsuario = async (
  supabase: SupabaseClient,
  userEmail: string
): Promise<boolean> => {
  try {
    // Buscar o usuário na tabela usuarios_autorizados
    const { data: usuarioAutorizado, error } = await supabase
      .from('usuarios_autorizados')
      .select('email')
      .eq('email', userEmail)
      .single();

    // Se houver erro ou nenhum usuário encontrado
    if (error || !usuarioAutorizado) {
      console.warn(`Acesso negado para: ${userEmail}`);
      return false;
    }

    console.log(`Acesso concedido para: ${userEmail}`);
    return true;
  } catch (erro) {
    console.error('Erro ao validar acesso:', erro);
    return false;
  }
};

/**
 * Realiza logout do usuário
 * @param supabase - Cliente Supabase
 */
export const fazerLogout = async (supabase: SupabaseClient): Promise<void> => {
  try {
    await supabase.auth.signOut();
    console.log('Usuário desconectado com sucesso');
  } catch (erro) {
    console.error('Erro ao desconectar:', erro);
  }
}; 
