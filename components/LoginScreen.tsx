
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
    } catch (err: any) {
      let message = err.message;
      if (message === 'Invalid login credentials') {
        message = 'Acesso negado. Credenciais não encontradas no Clube.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-city-black flex items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-copper-dark/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-copper-light/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-8 animate-in fade-in zoom-in duration-1000">
        <div className="flex flex-col items-center mb-12">
            <div className="mb-6 transform transition-transform hover:scale-110 duration-700">
                <svg width="120" height="50" viewBox="0 0 180 75" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <h1 className="font-serif text-5xl text-white italic tracking-tighter text-center">ATLAS 2026</h1>
            <div className="mt-4 flex items-center gap-3">
                <div className="h-[1px] w-8 bg-copper-dark/40"></div>
                <span className="text-[10px] text-copper-light uppercase tracking-[0.5em] font-black">
                  Membros Exclusivos
                </span>
                <div className="h-[1px] w-8 bg-copper-dark/40"></div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="relative group">
                    <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                    <input 
                        required
                        type="email" 
                        placeholder="E-mail Corporativo"
                        className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-white placeholder-gray-600 focus:border-copper-DEFAULT outline-none transition-all font-light"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                    <input 
                        required
                        type="password" 
                        placeholder="Senha de Acesso"
                        className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-white placeholder-gray-600 focus:border-copper-DEFAULT outline-none transition-all font-light"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300 backdrop-blur-md shadow-lg">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                    <span className="leading-relaxed">{error}</span>
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full group bg-copper-gradient text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-full flex items-center justify-center gap-2 shadow-[0_20px_40px_-10px_rgba(140,82,67,0.4)] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
            >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Acessar o Clube
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
            </button>
        </form>

        <div className="mt-16 flex flex-col items-center gap-2 opacity-30 grayscale transition-all hover:opacity-80 hover:grayscale-0 cursor-default">
            <span className="text-[8px] text-gray-400 uppercase tracking-[0.8em] font-medium">Official Platform</span>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Comitê Atlas • IBMEC</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
