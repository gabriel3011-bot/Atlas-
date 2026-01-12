
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, ChevronRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

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
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-city-black flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-copper-dark/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-copper-light/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-8 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
            <div className="mb-6 transform transition-transform hover:scale-110 duration-700">
                <svg width="140" height="60" viewBox="0 0 180 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skylineGrad" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#8C5243" />
                            <stop offset="50%" stopColor="#EBC0A0" />
                            <stop offset="100%" stopColor="#8C5243" />
                        </linearGradient>
                    </defs>
                    <path d="M5 65 V42 H15 V52 H22 V35 H32 V48 H38 V25 H50 V42 H56 V12 H68 V38 H73 V5 H88 V38 H93 V18 H108 V42 H115 V25 H128 V52 H135 V38 H152 V65 H5 Z" fill="url(#skylineGrad)" fillOpacity="0.8" />
                    <rect x="5" y="65" width="160" height="2" fill="#C5836A" />
                </svg>
            </div>
            
            <h1 className="font-serif text-5xl text-white italic tracking-tighter text-center uppercase font-black">Atlas</h1>
            <div className="mt-4 flex items-center gap-3">
                <div className="h-[1px] w-8 bg-copper-dark/40"></div>
                <span className="text-[9px] text-copper-light uppercase tracking-[0.5em] font-black">Acesso Comissões</span>
                <div className="h-[1px] w-8 bg-copper-dark/40"></div>
            </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                  <div className="relative group">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                      <input 
                          required
                          type="email" 
                          placeholder="E-mail"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:border-copper-DEFAULT outline-none transition-all font-light text-sm"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
                  <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                      <input 
                          required
                          type="password" 
                          placeholder="Senha"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:border-copper-DEFAULT outline-none transition-all font-light text-sm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                  </div>
              </div>

              <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full group bg-copper-gradient text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
              >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Entrar no Sistema <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
              </button>
              
              <div className="flex items-center justify-center gap-2 pt-2">
                <ShieldCheck size={12} className="text-gray-600" />
                <p className="text-center text-[8px] text-gray-600 uppercase tracking-widest font-bold">
                  Sincronização Segura Atlas
                </p>
              </div>
          </form>
        </div>

        <p className="mt-8 text-center text-[9px] text-gray-700 uppercase tracking-[0.3em] font-medium italic">
          Gestão Centralizada de Formaturas 2026
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
