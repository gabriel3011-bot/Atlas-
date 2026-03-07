import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { View } from '../types';

interface BreadcrumbProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const VIEW_LABELS: Record<View, string> = {
  [View.HOME]: 'Início',
  [View.DASHBOARD]: 'Kanban',
  [View.FINANCE]: 'Financeiro',
  [View.EVENTS]: 'Eventos',
  [View.MARKETING]: 'Marketing',
  [View.LEGAL]: 'Jurídico',
  [View.MEMBERS]: 'Membros',
  [View.MEETINGS]: 'Reuniões',
  [View.VOTING]: 'Votações',
  [View.GAME]: 'Clube Secreto'
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentView, setCurrentView }) => {
  if (currentView === View.HOME) return null;

  return (
    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <button 
        onClick={() => setCurrentView(View.HOME)}
        className="flex items-center gap-1.5 hover:text-copper-light transition-colors group"
      >
        <Home size={12} className="group-hover:scale-110 transition-transform" />
        <span>Atlas</span>
      </button>
      
      <ChevronRight size={10} className="text-gray-700" />
      
      <span className="text-copper-light">
        {VIEW_LABELS[currentView]}
      </span>
    </nav>
  );
};

export default Breadcrumb;
