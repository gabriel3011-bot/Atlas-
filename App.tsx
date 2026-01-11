
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { View } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Menu, 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Lock, 
  Loader2, 
  ChevronRight, 
  AlertCircle,
  LayoutDashboard,
  Megaphone,
  DollarSign
} from 'lucide-react';

// Lazy imports com Fallback para evitar Black Screen se o arquivo estiver corrompido
const KanbanBoard = React.lazy(() => import('./components/KanbanBoard'));
const MarketingGrid = React.lazy(() => import('./components/MarketingGrid'));
const FinanceDashboard = React.lazy(() => import('./components/FinanceDashboard'));
const SecretClubGame2048 = React.lazy(() => import('./components/SecretClubGame2048'));
const SecretTermoGame = React.lazy(() => import('./components/SecretTermoGame'));

// Componente de Fallback Seguro
const SafeFallback = () => (
  <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-3xl border border-dashed border-white/10 animate-pulse">
    <Loader2 className="text-copper-DEFAULT animate-spin mb-4" size={32} />
    <p className="text-gray-500 font-serif italic text-sm tracking-widest uppercase">Carregando Módulo Atlas...</p>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeGame, setActiveGame] = useState<'termo' | '2048'>('termo');
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Login State
  const [codinome, setCodinome] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codinome.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setLoginError(null);

    // Protocolo Atlas: Append @atlas.club automaticamente
    const ghostEmail = `${codinome.trim().toLowerCase()}@atlas.club`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: ghostEmail,
        password: password,
      });

      if (error) throw error;
    } catch (err: any) {
      setLoginError("Acesso Negado. Codinome não autorizado.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<SafeFallback />}>
        {(() => {
          switch (currentView) {
            case View.DASHBOARD: return <KanbanBoard />;
            case View.MARKETING: return <MarketingGrid />;
            case View.FINANCE: return <FinanceDashboard />;
            case View.GAME:
              return (
                <div className="flex flex-col h-full animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                      <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Secret Club</h2>
                      <p className="text-gray-500 font-light">Desafios táticos para a elite da comissão.</p>
                    </div>
                  </div>

                  {/* Sub-Tabs Secret Club */}
                  <div className="flex border-b border-white/5 space-x-10 mb-10">
                    <button 
                      onClick={() => setActiveGame('termo')}
                      className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative flex items-center gap-2 ${activeGame === 'termo' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      <Sparkles size={12} /> Senha do Dia
                      {activeGame === 'termo' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
                    </button>
                    <button 
                      onClick={() => setActiveGame('2048')}
                      className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative flex items-center gap-2 ${activeGame === '2048' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      <Gamepad2 size={12} /> Desafio 2048
                      {activeGame === '2048' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
                    </button>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-center min-h-[500px]">
                    {activeGame === 'termo' ? <SecretTermoGame /> : <SecretClubGame2048 />}
                  </div>
                </div>
              );
            default: return <KanbanBoard />;
          }
        })()}
      </Suspense>
    );
  };

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-city-black flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-t-2 border-copper-DEFAULT rounded-full animate-spin"></div>
        <div className="flex flex-col items-center">
          <h2 className="font-serif text-white italic text-xl tracking-widest animate-pulse">ATLAS</h2>
          <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.5em] mt-2">Initializing Secure Protocol</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // LOGIN SCREEN (SECRET SOCIETY STYLE)
  // ---------------------------------------------------------
  if (!session) {
    return (
      <div className="fixed inset-0 bg-city-black flex items-center justify-center p-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-copper-dark/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-copper-light/5 blur-[120px] rounded-full"></div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl text-white italic tracking-tighter uppercase mb-4">Atlas</h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-copper-dark/30"></div>
              <span className="text-[9px] text-copper-light uppercase tracking-[0.5em] font-black">Private Access</span>
              <div className="h-[1px] w-8 bg-copper-dark/30"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-copper-light transition-colors" />
                <input 
                  required
                  type="text" 
                  placeholder="Codinome"
                  autoComplete="username"
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-white placeholder-gray-700 focus:border-copper-DEFAULT outline-none transition-all font-light tracking-wide"
                  value={codinome}
                  onChange={(e) => setCodinome(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-copper-light transition-colors" />
                <input 
                  required
                  type="password" 
                  placeholder="Senha"
                  autoComplete="current-password"
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-white placeholder-gray-700 focus:border-copper-DEFAULT outline-none transition-all font-light tracking-wide"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                <AlertCircle size={14} /> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-copper-gradient text-black font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-full flex items-center justify-center gap-2 shadow-2xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : <>Entrar no Sistema <ChevronRight size={14} /></>}
            </button>
          </form>
          
          <p className="mt-8 text-center text-[8px] text-gray-700 uppercase tracking-[0.4em] font-medium italic">
            Powered by Atlas Secure Protocol
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN APP VIEW
  // ---------------------------------------------------------
  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-64 overflow-y-auto overflow-x-hidden bg-night-gradient flex flex-col h-full relative">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-city-black/90 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg italic text-white tracking-tighter uppercase">Atlas</span>
            <span className="text-[8px] font-black text-copper-light bg-copper-DEFAULT/10 px-1.5 py-0.5 rounded border border-copper-DEFAULT/20 uppercase tracking-widest">2026</span>
          </div>
          <div className="w-8"></div>
        </header>

        <div className="flex-1 w-full px-6 md:px-12 py-10 max-w-[1400px] mx-auto transition-all duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
