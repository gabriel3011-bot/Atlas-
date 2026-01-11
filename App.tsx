
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import { View } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Lock, 
  Loader2, 
  ChevronRight, 
  AlertCircle,
  Sparkles,
  Gamepad2,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Menu
} from 'lucide-react';

// Lazy imports para Safe Mode - Evita que um erro em um módulo derrube a aplicação inteira
const KanbanBoard = lazy(() => import('./components/KanbanBoard'));
const MarketingGrid = lazy(() => import('./components/MarketingGrid'));
const FinanceDashboard = lazy(() => import('./components/FinanceDashboard'));
const SecretClubGame2048 = lazy(() => import('./components/SecretClubGame2048'));
const SecretTermoGame = lazy(() => import('./components/SecretTermoGame'));

// Fallback robusto para Suspense
const ModuleFallback = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] w-full bg-city-black/20 rounded-3xl border border-dashed border-white/5 animate-in fade-in duration-500">
    <Loader2 className="text-copper-DEFAULT animate-spin mb-4" size={32} />
    <p className="text-gray-500 font-serif italic text-sm tracking-widest uppercase animate-pulse">
      Sincronizando Módulo Atlas...
    </p>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeGame, setActiveGame] = useState<'termo' | '2048'>('termo');
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
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
        }
      } catch (e) {
        console.error("Auth init failure:", e);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codinome.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setLoginError(null);

    // Protocolo Atlas: Append @atlas.club automaticamente para o Supabase
    const ghostEmail = `${codinome.trim().toLowerCase()}@atlas.club`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: ghostEmail,
        password: password,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginError("Acesso Negado. Codinome não autorizado.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const renderCurrentView = () => {
    return (
      <Suspense fallback={<ModuleFallback />}>
        {(() => {
          switch (currentView) {
            case View.DASHBOARD:
              return <KanbanBoard />;
            case View.MARKETING:
              return <MarketingGrid />;
            case View.FINANCE:
              return <FinanceDashboard />;
            case View.GAME:
              return (
                <div className="flex flex-col h-full animate-in fade-in duration-700">
                  <header className="mb-8">
                    <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Secret Club</h2>
                    <p className="text-gray-500 font-light">Desafios táticos para a elite Atlas.</p>
                  </header>

                  {/* Sub-Tabs Navigation for Secret Club */}
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
            default:
              return <KanbanBoard />;
          }
        })()}
      </Suspense>
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-city-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-2 border-copper-DEFAULT rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(197,131,106,0.2)]"></div>
        <h1 className="font-serif text-white italic text-2xl tracking-[0.3em] animate-pulse">ATLAS</h1>
        <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.6em] mt-3">Initialising Secure Core</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 bg-city-black flex items-center justify-center p-6 overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-copper-dark/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-copper-light/5 blur-[150px] rounded-full"></div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-16 animate-in slide-in-from-top-4 duration-1000">
            <h1 className="font-serif text-6xl text-white italic tracking-tighter uppercase mb-2">Atlas</h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-10 bg-white/5"></div>
              <span className="text-[9px] text-copper-light uppercase tracking-[0.6em] font-black">Private Protocol</span>
              <div className="h-[1px] w-10 bg-white/5"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 animate-in fade-in zoom-in duration-700 delay-200">
            <div className="space-y-6">
              <div className="relative group">
                <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-copper-light transition-colors" />
                <input 
                  required
                  type="text" 
                  placeholder="Codinome"
                  autoComplete="username"
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-4 text-white placeholder-gray-800 focus:border-copper-DEFAULT outline-none transition-all font-light tracking-wide text-sm"
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
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-4 text-white placeholder-gray-800 focus:border-copper-DEFAULT outline-none transition-all font-light tracking-wide text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-3 text-red-400 bg-red-500/5 border border-red-500/10 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-copper-gradient text-black font-black text-[11px] uppercase tracking-[0.4em] py-5 rounded-full flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <>Autenticar Acesso <ChevronRight size={16} /></>}
            </button>
          </form>
          
          <div className="mt-16 text-center space-y-2">
            <p className="text-[8px] text-gray-800 uppercase tracking-[0.5em] font-medium italic">
              Atlas Security Systems v2.6.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-64 overflow-y-auto overflow-x-hidden bg-night-gradient flex flex-col h-full relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-white/5 bg-city-black/95 backdrop-blur-xl sticky top-0 z-30 shadow-xl">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl italic text-white tracking-tighter uppercase font-bold">Atlas</span>
            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
            <span className="text-[9px] font-black text-copper-light uppercase tracking-widest">2026</span>
          </div>
          <div className="w-10"></div>
        </header>

        {/* Global Content Area */}
        <div className="flex-1 w-full px-6 md:px-16 py-12 max-w-[1500px] mx-auto transition-all duration-700">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};

export default App;
