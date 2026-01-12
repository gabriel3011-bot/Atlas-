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
import LoginScreen from './components/LoginScreen';
import FeedbackWidget from './components/FeedbackWidget';
import { View } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const App: React.FC = () => {
  // Estado que controla qual tela está visível
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Verificação de Autenticação (Supabase)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setAuthLoading(false);
      }).catch(() => setAuthLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Função que decide qual componente mostrar no meio da tela
  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD: return <KanbanBoard />;
      case View.FINANCE: return <FinanceDashboard />;
      case View.EVENTS: return <EventsCalendar />;
      case View.MARKETING: return <MarketingGrid />;
      case View.LEGAL: return <LegalDocs />;
      case View.MEMBERS: return <MembersTab />;
      case View.VOTING: return <VotingTab />;
      case View.GAME: return <SecretClubGame2048 />;
      default: return <KanbanBoard />;
    }
  };

  // Tela de Carregamento Inicial
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-city-black flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 border-4 border-white/5 border-t-copper-DEFAULT rounded-full animate-spin mb-4"></div>
            <span className="text-copper-light font-serif italic text-sm tracking-widest">ATLAS 2026</span>
        </div>
      </div>
    );
  }

  // Tela de Login (Se configurado Supabase e não logado)
  if (isSupabaseConfigured() && !session) {
    return <LoginScreen />;
  }

  const userEmail = session?.user?.email || 'comandante@atlas.com';

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      {/* SIDEBAR: Passamos 'setCurrentView' para que os botões funcionem.
         O z-index-50 garante que ela fique acima de qualquer conteúdo decorativo.
      */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      
      {/* ÁREA PRINCIPAL: ml-64 empurra o conteúdo para direita para não ficar embaixo da Sidebar */}
      <main className="flex-1 ml-64 h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-night-gradient relative z-0">
        <div className="min-h-full w-full px-8 py-10 max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Widget Flutuante */}
      <FeedbackWidget currentView={currentView} userEmail={userEmail} />
    </div>
  );
};

export default App;
