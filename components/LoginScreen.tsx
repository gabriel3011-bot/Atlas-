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

    setLoading(false);
    return;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-city-black flex items-center justify-center font-sans">
      <div className="fixed inset-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-blue-500/5 z-[200] w-full h-full pointer-events-none flex items-center justify-center overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="fixed inset-0 z-[200] bg-city-black flex items-center justify-center font-sans">
            <div className="absolute bg-sky-500/5 w-96 h-96 rounded-full blur-3xl -left-48 -top-48"></div>
            <div className="absolute bg-blue-600/5 w-96 h-96 rounded-full blur-3xl -right-48 -bottom-48"></div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="fixed inset-0 z-[200] w-full h-full bg-city-black flex items-center justify-center font-sans"
        >
          <div className="relative z-10 w-full max-w-sm px-8 py-12 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-white font-serif">ATLAS</h1>
              <p className="text-sm font-light tracking-widest text-slate-400">ACESSO COMISSÕES</p>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all duration-200"
              />

              <input
                type="password"
                id="senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  ENTRAR NO SISTEMA <ChevronRight size={18} />
                </>
              )}
            </button>

            {error && (
              <p id="erro" className="text-center text-sm text-red-500 font-medium">
                {error}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} />
              <p>SINCRONIZAÇÃO SEGURA ATLAS</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
