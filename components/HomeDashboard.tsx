import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ViewProps, MarketingPost, AppEvent, MeetingMinute, SystemSettings } from '../types';
import { Calendar, DollarSign, Megaphone, Clock, ArrowRight, FileText, Users, Edit2, X, Check, Activity, CheckCircle, FileSignature, Vote, Eye, EyeOff } from 'lucide-react';
import { View } from '../types';

const HomeDashboard: React.FC<ViewProps> = ({ isEditable, onNavigate }) => {
  const [todayPosts, setTodayPosts] = useState<MarketingPost[]>([]);
  const [nextEvent, setNextEvent] = useState<AppEvent | null>(null);
  const [financeSummary, setFinanceSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [recentMinutes, setRecentMinutes] = useState<MeetingMinute[]>([]);
  const [adherentsCount, setAdherentsCount] = useState<number>(0);
  const [isFinanceSecret, setIsFinanceSecret] = useState(true);
  const [systemOverview, setSystemOverview] = useState({
    pendingTasks: 0,
    pendingDocs: 0,
    activePolls: 0,
    totalMembers: 0
  });
  
  // Edit Adherents State
  const [isEditingAdherents, setIsEditingAdherents] = useState(false);
  const [newAdherentsCount, setNewAdherentsCount] = useState<string>('');
  
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

        // Fetch Recent Minutes
        try {
          const { data: minutes, error: minutesError } = await supabase
            .from('meeting_minutes')
            .select('*')
            .order('date', { ascending: false })
            .limit(3);
          
          if (minutes) setRecentMinutes(minutes);
          if (minutesError) throw minutesError;
        } catch (error) {
          console.error("Error fetching minutes from Supabase:", error);
        }

        // Fetch Adherents Count
        try {
          const { data: settings, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('id', 1)
            .single();
          
          if (settings) {
            setAdherentsCount(settings.adherents_count);
            localStorage.setItem('adherentsCount', settings.adherents_count.toString());
          } else if (error) {
            throw error;
          }
        } catch (e) {
          const localCount = localStorage.getItem('adherentsCount');
          if (localCount) setAdherentsCount(parseInt(localCount));
        }

        // Fetch System Overview
        try {
          const { count: pendingTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .in('status', ['TODO', 'DOING', 'REVIEW']);
            
          const { count: pendingDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
            
          const { count: activePolls } = await supabase
            .from('polls')
            .select('*', { count: 'exact', head: true })
            .gte('deadline', today);
            
          const { count: totalMembers } = await supabase
            .from('committee_members')
            .select('*', { count: 'exact', head: true });

          setSystemOverview(prev => ({
            ...prev,
            pendingTasks: pendingTasks || 0,
            pendingDocs: pendingDocs || 0,
            activePolls: activePolls || 0,
            totalMembers: totalMembers || 0
          }));
        } catch (e) {
          console.error('Error fetching overview:', e);
        }
      } else {
        const localCount = localStorage.getItem('adherentsCount');
        if (localCount) setAdherentsCount(parseInt(localCount));
      }

      // Load local fallback members
      const localMembersStr = localStorage.getItem('localMembers');
      if (localMembersStr) {
        try {
          const localMembers: any[] = JSON.parse(localMembersStr);
          setSystemOverview(prev => ({
            ...prev,
            totalMembers: prev.totalMembers + localMembers.length
          }));
        } catch (e) {
          console.error("Error parsing local members", e);
        }
      }

      // Load local fallback minutes and merge
      setRecentMinutes(prevMinutes => {
        let loadedMinutes = [...prevMinutes];
        const localMinutesStr = localStorage.getItem('localMinutes');
        if (localMinutesStr) {
          try {
            const localMinutes: any[] = JSON.parse(localMinutesStr);
            const existingIds = new Set(loadedMinutes.map(m => m.id));
            const newLocalMinutes = localMinutes.filter(m => !existingIds.has(m.id));
            loadedMinutes = [...newLocalMinutes, ...loadedMinutes]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3);
          } catch (e) {
            console.error("Error parsing local minutes", e);
          }
        }
        return loadedMinutes;
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleUpdateAdherents = async () => {
    const count = parseInt(newAdherentsCount);
    if (isNaN(count)) return;

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ id: 1, adherents_count: count, updated_at: new Date().toISOString() });
        
        if (error) throw error;
      }
      setAdherentsCount(count);
      localStorage.setItem('adherentsCount', count.toString());
      setIsEditingAdherents(false);
    } catch (error) {
      console.error('Error updating adherents:', error);
      // Fallback to local storage if table doesn't exist
      setAdherentsCount(count);
      localStorage.setItem('adherentsCount', count.toString());
      setIsEditingAdherents(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-copper-DEFAULT border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Adherents Card */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Users size={20} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aderidos</span>
              {isEditable && !isEditingAdherents && (
                <button 
                  onClick={() => {
                    setNewAdherentsCount(adherentsCount.toString());
                    setIsEditingAdherents(true);
                  }}
                  className="text-gray-500 hover:text-copper-light transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-auto">
            {isEditingAdherents ? (
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="number" 
                  value={newAdherentsCount}
                  onChange={(e) => setNewAdherentsCount(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-copper-DEFAULT outline-none"
                  autoFocus
                />
                <button onClick={handleUpdateAdherents} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                  <Check size={16} />
                </button>
                <button onClick={() => setIsEditingAdherents(false)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <h3 className="text-4xl font-serif font-bold italic text-white flex items-baseline gap-2">
                {adherentsCount}
                <span className="text-sm font-sans text-gray-500 not-italic font-normal">membros</span>
              </h3>
            )}
          </div>
        </div>

        {/* Finance Card */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
              <DollarSign size={20} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Caixa Atual</span>
              <button 
                onClick={() => setIsFinanceSecret(!isFinanceSecret)}
                className="text-gray-500 hover:text-copper-light transition-colors"
                title={isFinanceSecret ? "Revelar valores" : "Ocultar valores"}
              >
                {isFinanceSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="mt-auto">
            <h3 className={`text-3xl font-serif font-bold italic ${isFinanceSecret ? 'text-gray-500' : financeSummary.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {isFinanceSecret ? 'R$ •••••' : `R$ ${financeSummary.balance.toLocaleString('pt-BR')}`}
            </h3>
            <div className="mt-2 flex justify-between text-[10px] font-medium">
              <span className="text-gray-500">Entradas: <span className="text-green-400">{isFinanceSecret ? '•••••' : `R$ ${financeSummary.income.toLocaleString('pt-BR', { notation: "compact" })}`}</span></span>
              <span className="text-gray-500">Saídas: <span className="text-red-400">{isFinanceSecret ? '•••••' : `R$ ${financeSummary.expense.toLocaleString('pt-BR', { notation: "compact" })}`}</span></span>
            </div>
          </div>
        </div>

        {/* Next Event Card */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Próximo Evento</span>
          </div>
          {nextEvent ? (
            <>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-tight break-words">{nextEvent.title}</h3>
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
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all shadow-xl flex flex-col">
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Atas Recentes */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
          <h3 className="font-serif text-xl text-white italic mb-4 flex items-center gap-2">
            <FileText size={18} className="text-copper-light" />
            Atas Recentes
          </h3>
          <div className="space-y-2">
            {recentMinutes.length > 0 ? (
              recentMinutes.map(minute => (
                <div key={minute.id} className="p-3 bg-white/5 rounded-xl flex justify-between items-center group hover:bg-white/10 transition">
                  <div>
                    <span className="text-sm text-gray-300 block">{minute.title}</span>
                    <span className="text-[10px] text-gray-500">{new Date(minute.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {minute.file_url ? (
                    <a href={minute.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 group-hover:text-copper-light transition">
                      <ArrowRight size={16} />
                    </a>
                  ) : (
                    <div className="text-gray-600 group-hover:text-copper-light transition">
                      <FileText size={16} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-2">Nenhuma ata recente.</p>
            )}
          </div>
        </div>

        {/* Resumo da Operação */}
        <div className="bg-gradient-to-br from-copper-dark/20 to-black border border-copper-DEFAULT/20 rounded-2xl p-6 flex flex-col">
          <h3 className="font-serif text-xl text-white italic mb-4 flex items-center gap-2">
            <Activity size={18} className="text-copper-light" />
            Resumo da Operação
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button 
              onClick={() => onNavigate && onNavigate(View.DASHBOARD)}
              className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-copper-DEFAULT/30 transition-colors w-full"
            >
              <CheckCircle size={20} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">{systemOverview.pendingTasks}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Tarefas Pendentes</span>
            </button>
            
            <button 
              onClick={() => onNavigate && onNavigate(View.LEGAL)}
              className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-copper-DEFAULT/30 transition-colors w-full"
            >
              <FileSignature size={20} className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">{systemOverview.pendingDocs}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Contratos Pendentes</span>
            </button>
            
            <button 
              onClick={() => onNavigate && onNavigate(View.VOTING)}
              className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-copper-DEFAULT/30 transition-colors w-full"
            >
              <Vote size={20} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">{systemOverview.activePolls}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Votações Ativas</span>
            </button>
            
            <button 
              onClick={() => onNavigate && onNavigate(View.MEMBERS)}
              className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-copper-DEFAULT/30 transition-colors w-full"
            >
              <Users size={20} className="text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">{systemOverview.totalMembers}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Membros da Comissão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
