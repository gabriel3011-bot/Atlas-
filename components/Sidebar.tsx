
import React from 'react';
import { LayoutDashboard, DollarSign, Calendar, Megaphone, FileText, Users, BarChart3, Trophy } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Quadro', icon: LayoutDashboard },
    { id: View.FINANCE, label: 'Financeiro', icon: DollarSign },
    { id: View.EVENTS, label: 'Eventos', icon: Calendar },
    { id: View.MARKETING, label: 'Marketing', icon: Megaphone },
    { id: View.LEGAL, label: 'Jurídico', icon: FileText },
    { id: View.MEMBERS, label: 'Membros', icon: Users },
    { id: View.VOTING, label: 'Votações', icon: BarChart3 },
    { id: View.GAME, label: 'Secret Club', icon: Trophy },
  ];

  return (
    <div className="w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-city-black border-r border-white/10 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="pt-12 pb-8 px-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden group">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-copper-dark/20 blur-[70px] pointer-events-none group-hover:bg-copper-DEFAULT/25 transition-all duration-1000"></div>
        <div className="relative z-10 mb-[-5px] transform transition-all duration-1000 group-hover:scale-105">
          <svg width="180" height="75" viewBox="0 0 180 75" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chromeCopper" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8C5243" />
                <stop offset="20%" stopColor="#C5836A" />
                <stop offset="40%" stopColor="#EBC0A0" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#EBC0A0" />
                <stop offset="80%" stopColor="#C5836A" />
                <stop offset="100%" stopColor="#8C5243" />
              </linearGradient>
              <linearGradient id="reflectionGradient" x1="0" y1="55" x2="0" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C5836A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C5836A" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M5 55 V42 H15 V48 H22 V35 H32 V48 H38 V25 H50 V42 H56 V12 H68 V38 H73 V5 H88 V38 H93 V18 H108 V42 H115 V25 H128 V52 H135 V38 H152 V55 H5 Z" fill="url(#chromeCopper)" />
            <path d="M5 56 V62 H15 V59 H22 V65 H32 V59 H38 V70 H50 V62 H56 V75 H68 V65 H73 V75 H88 V65 H93 V75 H108 V62 H115 V70 H128 V58 H135 V65 H152 V56 H5 Z" fill="url(#reflectionGradient)" opacity="0.3" />
            <g fill="#FFFFFF" fillOpacity="0.4">
                <rect x="18" y="44" width="1.5" height="1.5" />
                <rect x="25" y="38" width="1.5" height="1.5" />
                <rect x="42" y="28" width="1.5" height="1.5" />
                <rect x="76" y="8" width="2" height="1.5" fillOpacity="0.7" />
                <rect x="76" y="16" width="1.5" height="1.5" />
                <rect x="80" y="12" width="1.5" height="1.5" />
                <rect x="120" y="28" width="1.5" height="1.5" />
            </g>
          </svg>
        </div>
        <div className="relative z-20 flex flex-col items-center">
            <div className="flex items-center">
                <span className="font-serif text-[2.8rem] font-bold tracking-[-0.05em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-copper-light to-copper-DEFAULT italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    IBMEC
                </span>
                <div className="ml-2 relative flex items-center justify-center h-9 min-w-[46px]">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-copper-light/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-copper-light/60 to-transparent"></div>
                    <div className="absolute left-0 top-1 bottom-1 w-[1.2px] bg-copper-light shadow-[0_0_6px_#EBC0A0]"></div>
                    <div className="absolute right-0 top-1 bottom-1 w-[1.2px] bg-copper-light shadow-[0_0_6px_#EBC0A0]"></div>
                    <span className="font-serif text-[1.7rem] text-white font-bold leading-none px-2 drop-shadow-md">26</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <div className="h-[0.5px] w-6 bg-gradient-to-r from-transparent to-copper-dark/40"></div>
                <span className="text-[9px] text-copper-light/50 uppercase tracking-[0.6em] font-semibold">Comissão</span>
                <div className="h-[0.5px] w-6 bg-gradient-to-l from-transparent to-copper-dark/40"></div>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-white/[0.04] text-white shadow-xl border border-white/5'
                  : 'text-gray-500 hover:text-copper-light hover:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-gradient-to-b from-copper-light to-copper-dark rounded-r-full shadow-[0_0_15px_#C5836A]" />
              )}
              <Icon 
                size={18} 
                className={`transition-all duration-500 ${isActive ? 'text-copper-light scale-110' : 'group-hover:text-copper-light group-hover:scale-110'}`} 
              />
              <span className={`text-sm font-medium tracking-wide transition-all duration-300 ${isActive ? 'text-white translate-x-1' : 'group-hover:translate-x-1'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-5 border-t border-white/5 bg-city-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all duration-500 cursor-pointer group">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-copper-dark via-copper-light to-white p-[1px]">
                    <div className="w-full h-full rounded-full bg-city-black flex items-center justify-center text-[10px] text-white font-bold font-serif">AD</div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-city-black rounded-full shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-200 truncate group-hover:text-copper-light transition-colors">Administrador</p>
                <p className="text-[9px] text-copper-light/60 uppercase tracking-widest font-black italic">Master Access</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
