
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import FeedbackWidget from './components/FeedbackWidget';
import LoginScreen from './components/LoginScreen';
import { View } from './types';

// Importações diretas de componentes
import KanbanBoard from './components/KanbanBoard';
import FinanceDashboard from './components/FinanceDashboard';
import EventsCalendar from './components/EventsCalendar';
import MarketingGrid from './components/MarketingGrid';
import LegalDocs from './components/LegalDocs';
import MembersTab from './components/MembersTab';
import VotingTab from './components/VotingTab';
import SecretClubGame2048 from './components/SecretClubGame2048';
import SecretTermoGame from './components/SecretTermoGame';

import { 
  Sparkles, 
  Gamepad2, 
  Menu 
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeGame, setActiveGame] = useState<'termo' | '2048'>('termo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <LoginScreen />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case View.DASHBOARD: return <KanbanBoard />;
      case View.FINANCE: return <FinanceDashboard />;
      case View.EVENTS: return <EventsCalendar />;
      case View.MARKETING: return <MarketingGrid />;
      case View.LEGAL: return <LegalDocs />;
      case View.MEMBERS: return <MembersTab />;
      case View.VOTING: return <VotingTab />;
      case View.GAME:
        return (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <header className="mb-8">
              <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Secret Club</h2>
              <p className="text-gray-500 font-light">Desafios táticos para a elite Atlas.</p>
            </header>

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
  };

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={session.user.email?.split('@')[0].toUpperCase()}
      />
      
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} overflow-y-auto overflow-x-hidden bg-night-gradient flex flex-col h-full relative transition-all duration-500`}>
        <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-city-black/95 backdrop-blur-xl sticky top-0 z-30 shadow-xl">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl italic text-white tracking-tighter uppercase font-bold">Atlas</span>
            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
            <span className="text-[9px] font-black text-copper-light uppercase tracking-widest">Gestão 2026</span>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full px-6 md:px-16 py-12 max-w-[1500px] mx-auto">
          {renderCurrentView()}
        </div>
      </main>

      <FeedbackWidget currentView={currentView} userEmail={session.user.email} />
    </div>
  );
};

export default App;

// Fix black screen issue
