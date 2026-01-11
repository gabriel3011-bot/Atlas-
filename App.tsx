import React, { useState, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import FeedbackWidget from './components/FeedbackWidget';
import { View } from './types';
import { 
  Loader2, 
  Sparkles, 
  Gamepad2, 
  Menu 
} from 'lucide-react';

// Mock User para o Bypass Mode
const MOCK_USER = {
  name: 'PRESIDENTE',
  email: 'comissao@atlas.club'
};

// Lazy imports dos Módulos (Conectando os arquivos que você enviou)
const KanbanBoard = lazy(() => import('./components/KanbanBoard'));
const MarketingGrid = lazy(() => import('./components/MarketingGrid'));
const FinanceDashboard = lazy(() => import('./components/FinanceDashboard'));
const SecretClubGame2048 = lazy(() => import('./components/SecretClubGame2048'));
const SecretTermoGame = lazy(() => import('./components/SecretTermoGame'));
// Novos Módulos adicionados
const MembersTab = lazy(() => import('./components/MembersTab'));
const EventsCalendar = lazy(() => import('./components/EventsCalendar'));
const LegalDocs = lazy(() => import('./components/LegalDocs'));

// Fallback visual para carregamento
const ModuleFallback = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] w-full bg-city-black/20 rounded-3xl border border-dashed border-white/5 animate-in fade-in duration-500">
    <Loader2 className="text-copper-DEFAULT animate-spin mb-4" size={32} />
    <p className="text-gray-500 font-serif italic text-sm tracking-widest uppercase animate-pulse">
      Sincronizando Módulo Atlas...
    </p>
  </div>
);

const App: React.FC = () => {
  // Estado de Login (Começa falso para exigir senha)
  // Se quiser pular o login para testes, mude para useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeGame, setActiveGame] = useState<'termo' | '2048'>('termo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Se não estiver logado, mostra a tela de Login
  if (!isLoggedIn) {
    return (
      <div className="relative">
        <LoginScreen />
        {/* Botão Secreto de DEV para pular o login (Canto inferior direito) */}
        <button 
          onClick={() => setIsLoggedIn(true)}
          className="fixed bottom-2 right-2 z-[250] opacity-30 hover:opacity-100 text-[10px] text-white font-bold bg-red-500 px-2 py-1 rounded"
        >
          [DEV: Pular Login]
        </button>
      </div>
    );
  }

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
            case View.MEMBERS:     // Nova Rota
              return <MembersTab />;
            case View.EVENTS:      // Nova Rota
              return <EventsCalendar />;
            case View.LEGAL:       // Nova Rota
              return <LegalDocs />;
            // Nota: Vi que você adicionou VOTING no types.ts, mas ainda não temos o componente Voting.
            // case View.VOTING: return <VotingComponent />; 
            case View.GAME:
              return (
                <div className="flex flex-col h-full animate-in fade-in duration-700">
                  <header className="mb-8">
                    <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Secret Club</h2>
                    <p className="text-gray-500 font-light">Desafios táticos para a elite Atlas.</p>
                  </header>

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
            default:
              return <KanbanBoard />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-city-black font-sans text-gray-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={MOCK_USER.name}
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

        {/* Conteúdo Principal */}
        <div className="flex-1 w-full px-6 md:px-16 py-12 max-w-[1500px] mx-auto transition-all duration-700">
          {renderCurrentView()}
        </div>
        
        {/* Widget Flutuante */}
        <FeedbackWidget currentView={currentView} userEmail={MOCK_USER.email} />
      </main>
    </div>
  );
};

export default App;
