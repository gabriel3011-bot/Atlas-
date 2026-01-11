
import React from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  Megaphone, 
  Trophy, 
  X, 
  LogOut,
  ShieldCheck,
  Calendar,
  FileText,
  Users,
  CheckSquare
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose, userName = 'COMANDANTE' }) => {
  // Lista completa de abas restaurada
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.FINANCE, label: 'Financeiro', icon: DollarSign },
    { id: View.EVENTS, label: 'Eventos', icon: Calendar },
    { id: View.MARKETING, label: 'Marketing', icon: Megaphone },
    { id: View.LEGAL, label: 'Jurídico', icon: FileText },
    { id: View.MEMBERS, label: 'Membros', icon: Users },
    { id: View.VOTING, label: 'Votações', icon: CheckSquare },
    { id: View.GAME, label: 'Secret Club', icon: Trophy },
  ];

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <div className={`
      w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-city-black border-r border-white/5 backdrop-blur-2xl transition-transform duration-500 ease-out
      ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Brand */}
      <div className="pt-12 pb-8 px-8 flex flex-col items-center border-b border-white/5 relative">
        <button onClick={onClose} className="lg:hidden absolute top-6 right-6 p-2 text-gray-600 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="text-center group cursor-default">
            <h1 className="font-serif text-3xl font-black tracking-tighter leading-none text-white italic transition-all group-hover:tracking-[0.1em]">ATLAS</h1>
            <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1px] w-4 bg-copper-dark/40"></div>
                <span className="text-[8px] text-copper-light uppercase tracking-[0.5em] font-black">Elite 2026</span>
                <div className="h-[1px] w-4 bg-copper-dark/40"></div>
            </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-8 px-5 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-white/5 text-white border border-white/5 shadow-xl'
                  : 'text-gray-600 hover:text-copper-light hover:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-copper-gradient rounded-r-full shadow-[0_0_10px_#C5836A]"></div>
              )}
              <Icon size={16} className={`${isActive ? 'text-copper-light' : 'group-hover:text-copper-light'} transition-colors`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-white' : 'group-hover:text-copper-light'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-5 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-copper-dark via-copper-light to-white p-[1.5px] shrink-0">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] text-white font-black italic">
                        {userName.charAt(0)}
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-white tracking-tighter truncate">{userName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                        <span className="text-[7px] text-gray-500 uppercase tracking-widest font-bold">Public Bypass</span>
                      </div>
                    </div>
                </div>
                <button 
                  className="p-2 text-gray-600 hover:text-red-500 transition-all active:scale-90"
                  onClick={() => window.location.reload()}
                >
                  <LogOut size={14} />
                </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 py-1 opacity-20 hover:opacity-100 transition-all">
               <ShieldCheck size={10} className="text-copper-light" />
               <span className="text-[7px] font-black uppercase tracking-[0.3em]">Bypass Protocol Active</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
