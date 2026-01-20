import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Lock, Mail, AlertCircle, LogIn, Send } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      // Filtrar erro no console para questões comuns de auth
      const msg = err.message || '';
      
      if (msg.toLowerCase().includes('email not confirmed')) {
         // Não loga como erro crítico no console, apenas avisa o usuário
         console.warn("Login attempt: Email not confirmed");
         setError('Este email aguarda confirmação. Verifique sua caixa de entrada.');
         setNeedsConfirmation(true);
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
         console.warn("Login attempt: Invalid credentials");
         setError('Email ou senha incorretos.');
      } else {
         console.error("Login Error:", err);
         setError('Acesso negado. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setResendSuccess(false);
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: window.location.origin,
            }
        });
        if (error) throw error;
        setResendSuccess(true);
        setError(null); // Limpa erro anterior se houver
    } catch (err: any) {
        console.error("Resend Error:", err);
        // Tratamento para rate limit (comum em dev)
        if (err.message && err.message.includes('Too many requests')) {
             setError('Muitas tentativas. Aguarde alguns minutos antes de reenviar.');
        } else {
             setError('Erro ao reenviar: ' + (err.message || 'Tente novamente.'));
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center overflow-hidden">
      {/* Background Ambience - Luzes de fundo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-copper-dark/10 blur-[120px] rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-copper-light/5 blur-[120px] rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-6">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-8 duration-700">
            <div className="mb-6 transform transition-transform hover:scale-105 duration-500 drop-shadow-[0_0_15px_rgba(197,131,106,0.3)]">
                <svg width="100" height="42" viewBox="0 0 180 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="loginCopper" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#8C5243" />
                            <stop offset="50%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#8C5243" />
                        </linearGradient>
                    </defs>
                    <path d="M5 55 V42 H15 V48 H22 V35 H32 V48 H38 V25 H50 V42 H56 V12 H68 V38 H73 V5 H88 V38 H93 V18 H108 V42 H115 V25 H128 V52 H135 V38 H152 V55 H5 Z" fill="url(#loginCopper)" />
                </svg>
            </div>
            <h1 className="font-serif text-3xl text-white italic tracking-tighter text-center">Acesso Restrito</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-medium mt-2">Atlas Management System</p>
        </div>

        {/* Login Form Container com Glassmorphism */}
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-500 relative overflow-hidden group">
            {/* Brilho sutil na borda superior */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                <div className="space-y-4">
                    <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-copper-light transition-colors duration-300" />
                        <input 
                            required
                            type="email" 
                            placeholder="Email Corporativo"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm placeholder-gray-600 focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT/20 outline-none transition-all duration-300 group-hover:border-white/20"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-copper-light transition-colors duration-300" />
                        <input 
                            required
                            type="password" 
                            placeholder="Senha de Acesso"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm placeholder-gray-600 focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT/20 outline-none transition-all duration-300 group-hover:border-white/20"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-3 border px-4 py-3 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1 text-red-300 bg-red-500/10 border-red-500/20">
                        <AlertCircle size={16} className="shrink-0" /> 
                        <span>{error}</span>
                    </div>
                )}
                
                {resendSuccess && (
                     <div className="flex items-center gap-3 border px-4 py-3 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1 text-green-300 bg-green-500/10 border-green-500/20">
                        <Send size={16} className="shrink-0" /> 
                        <span>Email de confirmação reenviado! Verifique sua caixa de entrada.</span>
                    </div>
                )}

                {needsConfirmation && !resendSuccess ? (
                    <button 
                        type="button" 
                        onClick={handleResendConfirmation}
                        disabled={loading}
                        className="w-full mt-2 bg-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Reenviar Email</>}
                    </button>
                ) : (
                    <button 
                        type="submit" 
                        disabled={loading || resendSuccess}
                        className="w-full mt-2 bg-copper-gradient text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(197,131,106,0.2)] hover:shadow-[0_0_30px_rgba(197,131,106,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        {/* Efeito de brilho no botão */}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                        
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={16} /> Entrar</>}
                    </button>
                )}
            </form>
        </div>
        
        <p className="text-center text-[9px] text-gray-700 mt-8 uppercase tracking-widest font-medium opacity-50 hover:opacity-100 transition-opacity cursor-default">
          Powered by Atlas 2026
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;