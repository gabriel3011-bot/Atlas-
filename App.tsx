import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import FinanceDashboard from './components/FinanceDashboard';
import EventsCalendar from './components/EventsCalendar';
import MarketingGrid from './components/MarketingGrid';
import LegalDocs from './components/LegalDocs';
import MembersTab from './components/MembersTab';
import VotingTab from './components/VotingTab';
import SecretClubGame2048 from './components/SecretClubGame2048';
import SecretTermoGame from './components/SecretTermoGame';
import LoginScreen from './components/LoginScreen';
import FeedbackWidget from './components/FeedbackWidget';
import HomeDashboard from './components/HomeDashboard';
import MeetingHub from './components/MeetingHub';
import { View, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Menu, Gamepad2, Sparkles, Trophy, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [activeGame, setActiveGame] = useState<'termo' | '2048'>('termo');
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Agora suporta múltiplos cargos
  const [userRoles, setUserRoles] = useState<UserRole[]>(['MEMBER']);

  const determineRoleFromEmail = (email: string): UserRole => {
    const normalizedEmail = email.toLowerCase();
    const admins = ['admin@atlas.com', 'presidente@atlas.com', 'vice@atlas.com', 'dev@atlas.com'];
    
    if (admins.includes(normalizedEmail)) return 'ADM';
    if (normalizedEmail.includes('financeiro')) return 'FINANCEIRO';
    if (normalizedEmail.includes('marketing')) return 'MARKETING';
    if (normalizedEmail.includes('eventos')) return 'EVENTOS';
    if (normalizedEmail.includes('juridico')) return 'JURIDICO';
    
    return 'MEMBER';
  };

  const syncUserRole = async (user: any) => {
    try {
      // Busca TODOS os cargos do usuário (agora que pode ter múltiplos)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const roles = data.map(r => r.role as UserRole);
        console.log("Cargos carregados do Supabase:", roles);
        setUserRoles(roles);
      } else {
        const initialRole = determineRoleFromEmail(user.email || '');
        console.log("Primeiro acesso. Definindo cargo inicial:", initialRole);
        
        await supabase.from('user_roles').insert([
          { user_id: user.id, role: initialRole }
        ]);
        
        setUserRoles([initialRole]);
      }
    } catch (err) {
      console.error("Erro ao sincronizar cargo:", err);
      setUserRoles([determineRoleFromEmail(user.email || '')]);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          syncUserRole(session.user);
        }
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          syncUserRole(session.user);
        }
      });
      return () => subscription.unsubscribe();
    } else {
      setAuthLoading(false);
      setUserRoles(['ADM']); // Fallback dev local
    }
  }, []);

  // Lógica de Permissões (Quem pode EDITAR o quê)
  const checkPermission = (view: View): boolean => {
    // 1. ADM pode tudo
    if (userRoles.includes('ADM')) return true;

    // 2. Todos podem jogar e ver Home/Meetings
    if (view === View.GAME || view === View.HOME || view === View.MEETINGS) return true;

    // 3. Todos podem ver e EDITAR membros (Solicitação do Usuário)
    if (view === View.MEMBERS) return true;

    // 4. Regras específicas por cargo (Verifica se possui o cargo na lista)
    switch (view) {
      case View.FINANCE: return userRoles.includes('FINANCEIRO');
      case View.MARKETING: return userRoles.includes('MARKETING');
      case View.EVENTS: return userRoles.includes('EVENTOS');
      case View.LEGAL: return userRoles.includes('JURIDICO');
      
      // Dashboard: Todos acessam, mas KanbanBoard filtra edições internamente
      case View.DASHBOARD: return true; 
      
      case View.VOTING: return false; // Apenas admin cria votações
      default: return false;
    }
  };

  const isEditable = checkPermission(currentView);

  const renderContent = () => {
    // Passamos userRoles para o Kanban para controle granular de múltiplos cargos
    switch (currentView) {
      case View.HOME: return <HomeDashboard isEditable={isEditable} userRoles={userRoles} />;
      case View.MEETINGS: return <MeetingHub isEditable={isEditable} userRoles={userRoles} />;
      case View.DASHBOARD: return <KanbanBoard isEditable={isEditable} userRoles={userRoles} />;
      case View.FINANCE: return <FinanceDashboard isEditable={isEditable} />;
      case View.EVENTS: return <EventsCalendar isEditable={isEditable} />;
      case View.MARKETING: return <MarketingGrid isEditable={isEditable} />;
      case View.LEGAL: return <LegalDocs isEditable={isEditable} />;
      case View.MEMBERS: return <MembersTab isEditable={isEditable} />;
      case View.VOTING: return <VotingTab isEditable={isEditable} />;
      case View.GAME:
        return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Clube Secreto</h2>
                <p className="text-gray-500 font-light">Desafios exclusivos para a comissão Atlas.</p>
              </div>
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-copper-DEFAULT/5 border border-copper-DEFAULT/10 rounded-full">
                <Trophy size={14} className="text-copper-light" />
                <span className="text-[10px] font-black text-copper-light uppercase tracking-widest">Membros Elite</span>
              </div>
            </div>

            <div className="flex border-b border-white/5 space-x-10 mb-10">
              <button 
                onClick={() => setActiveGame('termo')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeGame === 'termo' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <Sparkles size={14} />
                SENHA DO DIA
                {activeGame === 'termo' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
              </button>
              <button 
                onClick={() => setActiveGame('2048')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeGame === '2048' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <Gamepad2 size={14} />
                DESAFIO 2048
                {activeGame === '2048' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
              </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center animate-in fade-in duration-500 min-h-[600px]">
              {activeGame === 'termo' ? <SecretTermoGame /> : <SecretClubGame2048 />}
            </div>
          </div>
        );
      default: return <HomeDashboard isEditable={isEditable} userRoles={userRoles} />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-city-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/5 border-t-copper-DEFAULT rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] animate-pulse">Sincronizando Atlas</span>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured() && !session) return <LoginScreen />;

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRoles={userRoles}
      />
      
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-64 overflow-y-auto overflow-x-hidden bg-night-gradient flex flex-col h-full relative">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-city-black/90 backdrop-blur-xl sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg italic text-white tracking-tighter uppercase">Atlas</span>
            <span className="text-[8px] font-black text-copper-light bg-copper-DEFAULT/10 px-1.5 py-0.5 rounded border border-copper-DEFAULT/20 uppercase tracking-widest">2026</span>
          </div>
          <div className="w-8"></div>
        </header>

        <div className="flex-1 w-full px-4 md:px-12 py-8 max-w-[1600px] mx-auto transition-all duration-500">
           {/* Visual Indicator of Read-Only Mode */}
           {!isEditable && currentView !== View.GAME && currentView !== View.DASHBOARD && (
             <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg w-fit">
                <Lock size={12} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Acesso Somente Leitura</span>
             </div>
           )}
          {renderContent()}
        </div>
      </main>

      <FeedbackWidget 
        currentView={currentView} 
        userEmail={session?.user?.email || 'comandante@atlas.com'} 
      />
    </div>
  );
};

export default App;
