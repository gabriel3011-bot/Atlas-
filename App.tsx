
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
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setAuthLoading(false);
      }).catch(err => {
        console.warn("Falha ao conectar ao Supabase Auth, entrando em modo demo.");
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <KanbanBoard />;
      case View.FINANCE:
        return <FinanceDashboard />;
      case View.EVENTS:
        return <EventsCalendar />;
      case View.MARKETING:
        return <MarketingGrid />;
      case View.LEGAL:
        return <LegalDocs />;
      case View.MEMBERS:
        return <MembersTab />;
      case View.VOTING:
        return <VotingTab />;
      case View.GAME:
        return <SecretClubGame2048 />;
      default:
        return <KanbanBoard />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-city-black flex items-center justify-center">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white/5 border-t-copper-DEFAULT rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(197,131,106,0.2)]"></div>
            <span className="text-gray-500 font-serif italic animate-pulse tracking-widest uppercase text-[10px]">Sincronizando Atlas...</span>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured() && !session) {
    return <LoginScreen />;
  }

  const displayEmail = session?.user?.email || 'comandante@atlas2026.com';

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      
      {/* Área de Conteúdo Principal - Flexbox robusto para evitar cortes */}
      <main className="flex-1 ml-64 overflow-y-auto overflow-x-hidden custom-scrollbar bg-night-gradient relative">
        <div className="min-h-full w-full px-6 py-8 md:px-12 md:py-10 max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Widget de Suporte/Feedback */}
      <FeedbackWidget 
        currentView={currentView} 
        userEmail={displayEmail} 
      />
    </div>
  );
};

export default App;
