import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ViewProps, MarketingPost, AppEvent } from '../types';
import { Calendar, DollarSign, Megaphone, Clock, ArrowRight, FileText } from 'lucide-react';

const HomeDashboard: React.FC<ViewProps> = ({ isEditable }) => {
  const [todayPosts, setTodayPosts] = useState<MarketingPost[]>([]);
  const [nextEvent, setNextEvent] = useState<AppEvent | null>(null);
  const [financeSummary, setFinanceSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const today = new Date().toISOString().split('T')[0];

        // Fetch Marketing Posts for Today or Upcoming
        const { data: posts } = await supabase
          .from('marketing_posts')
          .select('*')
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .limit(3);
        
        if (posts) setTodayPosts(posts);

        // Fetch Next Event
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(1);
        
        if (events && events.length > 0) setNextEvent(events[0]);

        // Fetch Finance Summary
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, type');
        
        if (transactions) {
          const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
          const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
          setFinanceSummary({ balance: income - expense, income, expense });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-copper-DEFAULT border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Visão Geral</h2>
          <p className="text-gray-500 font-light capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Sistema Operacional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Finance Card */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Caixa Atual</span>
          </div>
          <h3 className={`text-3xl font-serif font-bold italic ${financeSummary.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            R$ {financeSummary.balance.toLocaleString('pt-BR')}
          </h3>
          <div className="mt-4 flex justify-between text-xs font-medium">
            <span className="text-gray-500">Entradas: <span className="text-green-400">R$ {financeSummary.income.toLocaleString('pt-BR', { notation: "compact" })}</span></span>
            <span className="text-gray-500">Saídas: <span className="text-red-400">R$ {financeSummary.expense.toLocaleString('pt-BR', { notation: "compact" })}</span></span>
          </div>
        </div>

        {/* Next Event Card */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Próximo Evento</span>
          </div>
          {nextEvent ? (
            <>
              <h3 className="text-xl font-bold text-white mb-1 truncate">{nextEvent.title}</h3>
              <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                <Clock size={14} /> {new Date(nextEvent.event_date).toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest text-copper-light bg-copper-DEFAULT/10 px-2 py-1 rounded">
                  {nextEvent.category || 'Geral'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-600">
              <Calendar size={24} className="mb-2 opacity-50" />
              <span className="text-xs">Nenhum evento próximo</span>
            </div>
          )}
        </div>

        {/* Marketing Summary */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <Megaphone size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Marketing (Próximos)</span>
          </div>
          <div className="space-y-3">
            {todayPosts.length > 0 ? (
              todayPosts.map(post => (
                <div key={post.id} className="flex items-center gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full ${post.platform === 'Instagram' ? 'bg-pink-500' : 'bg-black border border-white'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-300 truncate">{post.caption || 'Sem legenda'}</p>
                    <p className="text-[10px] text-gray-600">{new Date(post.scheduled_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Nada agendado para hoje.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions / Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <h3 className="font-serif text-xl text-white italic mb-4 flex items-center gap-2">
            <FileText size={18} className="text-copper-light" />
            Atas Recentes
          </h3>
          <div className="space-y-2">
            {/* Placeholder for recent minutes - would need to fetch */}
            <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-white/10 transition">
              <span className="text-sm text-gray-300">Reunião Geral - 15/02</span>
              <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition" />
            </div>
            <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-white/10 transition">
              <span className="text-sm text-gray-300">Alinhamento Financeiro - 10/02</span>
              <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-copper-dark/20 to-black border border-copper-DEFAULT/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
          <h3 className="font-serif text-2xl text-white italic mb-2">Área da Presidência</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Acesse relatórios detalhados e aprove solicitações pendentes.</p>
          <button className="px-6 py-2 bg-copper-DEFAULT text-white font-bold text-xs uppercase tracking-widest rounded-full hover:bg-copper-light transition shadow-lg shadow-copper-DEFAULT/20">
            Ver Relatórios Completos
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
