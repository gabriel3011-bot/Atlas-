
import React from 'react';
import { LayoutDashboard, DollarSign, Megaphone, Trophy, X, LogOut } from 'lucide-react';
import { View } from '../types';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.MARKETING, label: 'Marketing', icon: Megaphone },
    { id: View.FINANCE, label: 'Financeiro', icon: DollarSign },
    { id: View.GAME, label: 'Secret Club', icon: Trophy },
  ];

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getUsername = () => {
    // Busca o codinome do email ghost
    const userEmail = supabase.auth.getUser() ? (window as any)._sessionUserEmail : '';
    // Como o getUser é async, buscamos do auth nativo se possível
    const current = (supabase.auth as any).session?.()?.user?.email || 'comandante@atlas.club';
    return current.split('@')[0].toUpperCase();
  };

  return (
    <div className={`
      w-64 h-screen flex flex-col fixed left-0 top-0 z-50 bg-city-black border-r border-white/10 backdrop-blur-xl transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="pt-12 pb-10 px-8 flex flex-col items-center border-b border-white/5 relative">
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 p-2 text-gray-600 hover:text-white"><X size={20} /></button>
        
        <div className="text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tighter leading-none text-white italic">ATLAS</h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="h-[1px] w-4 bg-copper-dark/40"></div>
                <span className="text-[8px] text-copper-light uppercase tracking-[0.4em] font-black">Elite 2026</span>
                <div className="h-[1px] w-4 bg-copper-dark/40"></div>
            </div>
        </div>
      </div>

      <nav className="flex-1 py-10 px-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-white/5 text-white border border-white/5 shadow-xl'
                  : 'text-gray-600 hover:text-copper-light hover:bg-white/[0.02]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-copper-light' : ''} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'group-hover:text-copper-light'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 bg-city-black/50">
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-copper-gradient flex items-center justify-center text-[10px] text-black font-black italic">A</div>
              <div>
                <p className="text-[10px] font-black text-white tracking-tighter truncate max-w-[100px]">{getUsername()}</p>
                <p className="text-[8px] text-copper-light uppercase tracking-widest font-black italic opacity-60">Status: ON</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
