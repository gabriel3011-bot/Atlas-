
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Instagram, 
  Smartphone, 
  Heart, 
  MessageCircle, 
  Send, 
  MoreHorizontal,
  Bookmark,
  LayoutGrid,
  Check,
  X,
  Image as ImageIcon,
  Clock,
  Video
} from 'lucide-react';
import { MarketingPost } from '../types';

// Tipagem local garantida para evitar erros de importação
type MarketingViewMode = 'calendar' | 'feed';

const MarketingGrid: React.FC = () => {
  const [activeView, setActiveView] = useState<MarketingViewMode>('calendar');
  
  // Dados iniciais vazios (sem mock data fictício)
  const [posts, setPosts] = useState<MarketingPost[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    caption: '',
    platform: 'Instagram',
    scheduled_date: new Date().toISOString().split('T')[0],
    image_url: ''
  });

  // Lógica do Calendário blindada contra objetos nulos
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Array simples para evitar complexidade de objetos
    const days: ({ day: number; date: string } | null)[] = [];
    
    // Ajuste para começar na Segunda-feira (padrão BR)
    const startPadding = (firstDay.getDay() + 6) % 7;
    
    for (let i = 0; i < startPadding; i++) {
        days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({ day: i, date: dateStr });
    }
    return days;
  }, []);

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const post: MarketingPost = {
      id: Date.now(),
      image_url: '',
      caption: newPostData.caption,
      scheduled_date: newPostData.scheduled_date,
      platform: newPostData.platform as 'Instagram' | 'TikTok',
      status: 'scheduled',
      likes_count: 0,
      comments_count: 0
    };
    setPosts([post, ...posts]);
    setIsAddModalOpen(false);
    setNewPostData({
      caption: '',
      platform: 'Instagram',
      scheduled_date: new Date().toISOString().split('T')[0],
      image_url: ''
    });
  };

  const getPostsForDate = (date: string) => {
      if (!date) return [];
      return posts.filter(p => p.scheduled_date === date);
  };

  // Componente visual para substituir imagens (evita erros de carregamento)
  const PlaceholderImage = ({ platform }: { platform: string }) => (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 transition-colors ${
        platform === 'Instagram' 
        ? 'bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-orange-900/40' 
        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
    }`}>
        {platform === 'Instagram' ? (
            <Instagram size={48} className="text-white/20 mb-2" />
        ) : (
            <Video size={48} className="text-white/20 mb-2" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Mídia {platform}
        </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-white italic tracking-tight">Marketing & Conteúdo</h2>
          <p className="text-gray-500 font-light text-sm">Planejamento visual e curadoria Atlas.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-copper-gradient text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] transition-all hover:-translate-y-1 w-full md:w-auto"
        >
          <Plus size={20} /> Novo Post
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-white/5 space-x-10 mb-8">
        <button 
          onClick={() => setActiveView('calendar')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeView === 'calendar' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <CalendarIcon size={14} />
          Calendário
          {activeView === 'calendar' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveView('feed')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeView === 'feed' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <LayoutGrid size={14} />
          Feed / Posts
          {activeView === 'feed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
      </div>

      {/* Conditional Rendering */}
      <div className="flex-1">
        {activeView === 'calendar' ? (
          /* STRATEGIC CALENDAR VIEW */
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-x-auto custom-scrollbar h-fit">
            <div className="min-w-[800px]">
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 mb-6">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 py-4">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              <div className="grid grid-cols-7 gap-3 md:gap-4">
                {calendarDays.map((dayObj, idx) => (
                  <div 
                    key={idx} 
                    className={`min-h-[120px] md:min-h-[140px] rounded-2xl border p-3 md:p-4 transition-all flex flex-col gap-2 ${
                      !dayObj 
                        ? 'bg-transparent border-transparent' 
                        : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40 group'
                    }`}
                  >
                    {dayObj ? (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-bold ${
                            dayObj.date === new Date().toISOString().split('T')[0] 
                              ? 'text-copper-light bg-copper-DEFAULT/10 px-2 py-0.5 rounded-md' 
                              : 'text-gray-700 group-hover:text-gray-400'
                          }`}>
                            {dayObj.day}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar max-h-24">
                          {getPostsForDate(dayObj.date).map(post => (
                            <div 
                              key={post.id} 
                              className={`group/post relative p-2 rounded-lg border text-[9px] font-bold text-white flex items-center gap-2 overflow-hidden transition-all hover:scale-105 shadow-lg ${
                                post.platform === 'Instagram' 
                                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-pink-500/20' 
                                  : 'bg-zinc-800/20 border-zinc-700/30'
                              }`}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${post.platform === 'Instagram' ? 'bg-pink-500' : 'bg-white'}`}></div>
                              {post.platform === 'Instagram' ? <Instagram size={10} className="text-pink-500" /> : <Smartphone size={10} className="text-white" />}
                              <span className="truncate">{post.caption}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => {
                            setNewPostData(prev => ({ ...prev, scheduled_date: dayObj.date }));
                            setIsAddModalOpen(true);
                          }}
                          className="mt-auto opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-copper-light transition-all flex items-center gap-1"
                        >
                          <Plus size={12} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Slot</span>
                        </button>
                      </>
                    ) : (
                        /* Renderização segura para dias vazios */
                        <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* SOCIAL FEED VIEW - SAFE MODE */
          <div className="max-w-xl mx-auto space-y-8 pb-24">
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                    <div className="p-4 bg-white/5 rounded-full mb-4">
                        <LayoutGrid size={32} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 font-serif italic">Nenhuma publicação agendada.</p>
                </div>
            ) : (
                posts.sort((a,b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((post) => (
                    <div key={post.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                        {/* Post Header */}
                        <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-copper-dark via-copper-light to-white p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">A</div>
                            </div>
                            <div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">atlas.2026</h4>
                            <p className="text-[9px] text-gray-500 flex items-center gap-1 font-bold">
                                {post.platform === 'Instagram' ? <Instagram size={10} /> : <Smartphone size={10} />}
                                {/* Proteção contra datas inválidas */}
                                {post.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString('pt-BR') : 'Data n/a'}
                            </p>
                            </div>
                        </div>
                        <MoreHorizontal size={20} className="text-gray-600 cursor-pointer hover:text-white transition-colors" />
                        </div>

                        {/* Post Image Placeholder */}
                        <div className="aspect-square relative group bg-black">
                        <PlaceholderImage platform={post.platform} />
                        
                        {post.status === 'scheduled' && (
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                            <Clock size={12} className="text-copper-light" />
                            <span className="text-[8px] font-black uppercase text-white tracking-widest">Agendado</span>
                            </div>
                        )}
                        </div>

                        {/* Post Actions & Caption */}
                        <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 text-white">
                            <Heart size={24} className={post.status === 'posted' ? 'fill-copper-light text-copper-light' : 'hover:text-copper-light transition-colors cursor-pointer'} />
                            <MessageCircle size={24} className="hover:text-copper-light transition-colors cursor-pointer" />
                            <Send size={24} className="hover:text-copper-light transition-colors cursor-pointer" />
                            </div>
                            <Bookmark size={24} className="text-white hover:text-copper-light transition-colors cursor-pointer" />
                        </div>

                        <div className="space-y-1">
                            {post.status === 'posted' && (
                            <p className="text-[11px] font-bold text-white tracking-wide">{post.likes_count?.toLocaleString()} curtidas</p>
                            )}
                            <p className="text-sm text-gray-300 leading-relaxed">
                            <span className="font-bold text-white mr-2">atlas.2026</span>
                            {/* Renderização segura de texto */}
                            {String(post.caption)}
                            </p>
                        </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* "Novo Post" Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-copper-DEFAULT/10 rounded-xl">
                  <ImageIcon className="text-copper-light" size={24} />
                </div>
                <h3 className="font-serif text-2xl text-white italic">Criar Publicação</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24}/>
              </button>
            </div>

            <form onSubmit={handleAddPost} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Legenda / Caption</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-copper-DEFAULT outline-none resize-none italic text-sm" 
                  placeholder="Compartilhe a visão da Atlas..." 
                  value={newPostData.caption} 
                  onChange={e => setNewPostData({...newPostData, caption: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Data Agendada</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none [color-scheme:dark] text-xs" 
                    value={newPostData.scheduled_date} 
                    onChange={e => setNewPostData({...newPostData, scheduled_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Plataforma</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none text-xs" 
                    value={newPostData.platform} 
                    onChange={e => setNewPostData({...newPostData, platform: e.target.value})}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-white/5 rounded-2xl transition">Descartar</button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-copper-gradient text-black font-black rounded-2xl shadow-xl flex justify-center items-center gap-2 transition-all hover:-translate-y-1 active:scale-95"
                >
                  <Send size={18} /> Agendar Conteúdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingGrid;
