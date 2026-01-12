
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
      {/* Brand Header: Atlas Original */}
      <div className="pt-10 pb-8 px-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden group">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-copper-dark/20 blur-[70px] pointer-events-none group-hover:bg-copper-light/10 transition-all duration-1000"></div>
        
        {/* Logo Original Atlas */}
        <div className="relative z-10 mb-6 transform transition-transform hover:scale-110 duration-700">
            <svg width="120" height="50" viewBox="0 0 180 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="sidebarCopper" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8C5243" />
                        <stop offset="50%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#8C5243" />
                    </linearGradient>
                </defs>
                <path d="M5 55 V42 H15 V48 H22 V35 H32 V48 H38 V25 H50 V42 H56 V12 H68 V38 H73 V5 H88 V38 H93 V18 H108 V42 H115 V25 H128 V52 H135 V38 H152 V55 H5 Z" fill="url(#sidebarCopper)" />
            </svg>
        </div>

        <div className="relative z-20 flex flex-col items-center">
            <h1 className="font-serif text-[2.4rem] font-bold tracking-tighter leading-none text-white italic drop-shadow-2xl">
                ATLAS
            </h1>
            <div className="flex items-center gap-2 mt-3">
                <div className="h-[1px] w-6 bg-copper-dark/40"></div>
                <span className="text-[9px] text-copper-light uppercase tracking-[0.5em] font-black">2026</span>
                <div className="h-[1px] w-6 bg-copper-dark/40"></div>
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
                  ? 'bg-white/5 text-white shadow-xl border border-white/5'
                  : 'text-gray-500 hover:text-copper-light hover:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-copper-gradient rounded-r-full shadow-[0_0_15px_#C5836A]" />
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
                    <div className="w-full h-full rounded-full bg-city-black flex items-center justify-center text-[10px] text-white font-bold font-serif italic">A</div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-city-black rounded-full shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-200 truncate group-hover:text-copper-light transition-colors">Comandante</p>
                <p className="text-[9px] text-copper-light/60 uppercase tracking-widest font-black italic">Acesso Master</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
