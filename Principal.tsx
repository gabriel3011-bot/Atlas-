
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
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
            <div className="w-12 h-12 border-4 border-copper-dark border-t-copper-light rounded-full animate-spin mb-4"></div>
            <span className="text-gray-500 font-serif italic animate-pulse">Autenticando acesso...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-city-black font-sans text-gray-200 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      
      {/* Área de Conteúdo Principal */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full pb-20">
          {renderContent()}
        </div>
      </main>

      {/* Widget de Suporte/Feedback */}
      <FeedbackWidget 
        currentView={currentView} 
        userEmail={session.user.email} 
      />
    </div>
  );
};

export default App;
