
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Video,
  Settings,
  Grid3X3,
  UserCheck,
  Upload,
  Loader2,
  List,
  Trello,
  GanttChartSquare,
  AlertCircle
} from 'lucide-react';
import { MarketingPost, ViewProps, MarketingStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

type MarketingViewMode = 'calendar' | 'feed' | 'list' | 'kanban' | 'timeline';

interface MarketingGridProps extends ViewProps {}

const MarketingGrid: React.FC<MarketingGridProps> = ({ isEditable }) => {
  const [activeView, setActiveView] = useState<MarketingViewMode>('calendar');
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estado para Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPostData, setNewPostData] = useState({
    caption: '',
    platform: 'Instagram',
    scheduled_date: new Date().toISOString().split('T')[0],
    image_url: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('marketing_posts').select('*').order('scheduled_date', { ascending: false });
            if (error) {
                console.error('Erro ao buscar posts:', error);
                return;
            }
            if (data) setPosts(data);
        }
    } catch (err) {
        console.error('Exceção ao buscar posts:', err);
    }
  };

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: ({ day: number; date: string } | null)[] = [];
    const startPadding = (firstDay.getDay() + 6) % 7;
    
    for (let i = 0; i < startPadding; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({ day: i, date: dateStr });
    }
    return days;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Validação básica de tamanho (ex: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("O arquivo é muito grande. Máximo permitido: 5MB");
            return;
        }
        setSelectedFile(file);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    setIsUploading(true);

    try {
        let finalImageUrl = newPostData.image_url;

        // Lógica de Upload
        if (selectedFile) {
            if (isSupabaseConfigured()) {
                // 1. Sanitização do nome do arquivo para evitar erros com caracteres especiais
                const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                // Gera um nome único: Timestamp + String Aleatória
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = fileName; // Salva na raiz do bucket

                // 2. Upload para o Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('marketing-images')
                    .upload(filePath, selectedFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Erro detalhado do upload:', uploadError);
                    throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
                }

                // 3. Obter URL Pública
                const { data } = supabase.storage
                    .from('marketing-images')
                    .getPublicUrl(filePath);
                
                if (!data || !data.publicUrl) {
                    throw new Error("Não foi possível gerar a URL pública da imagem.");
                }

                finalImageUrl = data.publicUrl;
            } else {
                // Fallback local se o Supabase não estiver configurado (apenas para dev)
                finalImageUrl = URL.createObjectURL(selectedFile);
            }
        }

        const postPayload = {
            caption: newPostData.caption,
            platform: newPostData.platform as 'Instagram' | 'TikTok',
            scheduled_date: newPostData.scheduled_date,
            image_url: finalImageUrl || null,
            status: 'scheduled',
            likes_count: 0,
            comments_count: 0
        };

        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('marketing_posts').insert([postPayload]).select();
            if (error) {
                console.error('Erro de inserção:', error);
                throw new Error(`Erro ao salvar post no banco: ${error.message}`);
            }
            if (data) setPosts([data[0], ...posts]);
        } else {
            const mockPost: MarketingPost = { ...postPayload, id: Date.now() } as MarketingPost;
            setPosts([mockPost, ...posts]);
        }

        // Reset do formulário apenas em caso de sucesso
        setIsAddModalOpen(false);
        setNewPostData({
            caption: '',
            platform: 'Instagram',
            scheduled_date: new Date().toISOString().split('T')[0],
            image_url: ''
        });
        setSelectedFile(null);

    } catch (err: any) {
        console.error("Erro no processo de criação:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Não foi possível criar a publicação.\nDetalhe: ${errorMessage}`);
    } finally {
        setIsUploading(false);
    }
  };

  const getPostsForDate = (date: string) => {
      if (!date) return [];
      return posts.filter(p => p.scheduled_date === date);
  };

  const PlaceholderImage = ({ platform }: { platform: string }) => (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 transition-colors ${
        platform === 'Instagram' 
        ? 'bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-orange-900/40' 
        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
    }`}>
        {platform === 'Instagram' ? (
            <Instagram size={24} className="text-white/20 mb-2" />
        ) : (
            <Video size={24} className="text-white/20 mb-2" />
        )}
        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
            {platform}
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
        
        {isEditable && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-copper-gradient text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] transition-all hover:-translate-y-1 w-full md:w-auto"
          >
            <Plus size={20} /> Novo Post
          </button>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-white/5 space-x-8 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => setActiveView('calendar')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0 ${activeView === 'calendar' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <CalendarIcon size={14} />
          Calendário
          {activeView === 'calendar' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveView('kanban')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0 ${activeView === 'kanban' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <Trello size={14} />
          Kanban
          {activeView === 'kanban' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveView('timeline')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0 ${activeView === 'timeline' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <GanttChartSquare size={14} />
          Linha do Tempo
          {activeView === 'timeline' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveView('feed')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0 ${activeView === 'feed' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <LayoutGrid size={14} />
          Feed Preview
          {activeView === 'feed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveView('list')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0 ${activeView === 'list' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <List size={14} />
          Lista
          {activeView === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
      </div>

      {/* Conditional Rendering */}
      <div className="flex-1">
        {activeView === 'calendar' ? (
          /* CALENDAR VIEW */
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-x-auto custom-scrollbar h-fit">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 mb-6">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 py-4">
                    {d}
                  </div>
                ))}
              </div>

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
                    {dayObj && (
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

                        {isEditable && (
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
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeView === 'kanban' ? (
          /* KANBAN VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
            {(['idea', 'scheduled', 'posted'] as MarketingStatus[]).map(status => (
              <div key={status} className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                    {status === 'idea' ? '💡 Ideias' : status === 'scheduled' ? '📅 Agendados' : '✅ Postados'}
                  </h4>
                  <span className="text-[10px] font-bold text-gray-700 bg-white/5 px-2 py-0.5 rounded-full">
                    {posts.filter(p => p.status === status).length}
                  </span>
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  {posts.filter(p => p.status === status).map(post => (
                    <div key={post.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 shadow-xl hover:border-copper-DEFAULT/30 transition-all group">
                      {post.image_url && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 border border-white/5">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      )}
                      <p className="text-xs text-gray-300 font-medium mb-3 line-clamp-3 italic">"{post.caption}"</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                          {post.platform === 'Instagram' ? <Instagram size={12} className="text-pink-500" /> : <Video size={12} className="text-white" />}
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{post.platform}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-600">
                          {new Date(post.scheduled_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isEditable && status === 'idea' && (
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-gray-600 hover:text-copper-light hover:border-copper-DEFAULT/20 hover:bg-white/5 transition-all flex flex-col items-center gap-2"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Nova Ideia</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : activeView === 'timeline' ? (
          /* TIMELINE VIEW */
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-x-auto custom-scrollbar">
            <div className="min-w-[1200px] relative">
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5 -translate-y-1/2"></div>
              <div className="flex justify-between items-center gap-12 relative z-10">
                {posts.sort((a,b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).map((post, idx) => {
                  const date = new Date(post.scheduled_date);
                  const isPast = date < new Date();
                  const diffTime = date.getTime() - new Date().getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <div key={post.id} className={`flex flex-col items-center gap-4 transition-all hover:-translate-y-2 ${idx % 2 === 0 ? 'mt-32' : 'mb-32 flex-col-reverse'}`}>
                      <div className={`w-48 bg-zinc-900 border rounded-2xl p-4 shadow-2xl relative ${isPast ? 'border-green-500/20 opacity-60' : 'border-copper-DEFAULT/20'}`}>
                        <div className={`absolute left-1/2 w-[1px] h-16 bg-white/10 -translate-x-1/2 ${idx % 2 === 0 ? '-top-16' : '-bottom-16'}`}></div>
                        <div className={`absolute left-1/2 w-3 h-3 rounded-full bg-copper-DEFAULT -translate-x-1/2 ${idx % 2 === 0 ? '-top-[68px]' : '-bottom-[68px]'}`}></div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black text-copper-light uppercase tracking-widest">{post.platform}</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${isPast ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isPast ? 'Concluído' : `${diffDays} dias`}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-300 line-clamp-2 mb-2 italic">"{post.caption}"</p>
                        <div className="text-[9px] font-mono text-gray-600 flex items-center gap-1">
                          <Clock size={10} />
                          {date.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">{date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeView === 'list' ? (
          /* LIST VIEW */
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl overflow-hidden">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-xl text-white italic">Gestão de Prazos & Conteúdo</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-lg">
                    <Check size={12} className="text-green-500" />
                    <span className="text-[10px] font-bold text-green-500 uppercase">Postados: {posts.filter(p => p.status === 'posted').length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                    <Clock size={12} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Pendentes: {posts.filter(p => p.status !== 'posted').length}</span>
                  </div>
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/5">
                     <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Conteúdo</th>
                     <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Plataforma</th>
                     <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                     <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Prazo / Data</th>
                     <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {posts.length > 0 ? (
                      posts.map(post => {
                        const date = new Date(post.scheduled_date);
                        const isOverdue = date < new Date() && post.status !== 'posted';
                        return (
                          <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {post.image_url ? (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <ImageIcon size={16} className="text-gray-600" />
                                  </div>
                                )}
                                <span className="text-sm text-gray-300 font-medium truncate max-w-[200px] italic">"{post.caption || 'Sem legenda'}"</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {post.platform === 'Instagram' ? <Instagram size={14} className="text-pink-500" /> : <Video size={14} className="text-white" />}
                                <span className="text-xs text-gray-400">{post.platform}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                post.status === 'posted' ? 'bg-green-500/10 text-green-500' : 
                                post.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' : 
                                'bg-gray-500/10 text-gray-500'
                              }`}>
                                {post.status === 'posted' ? 'Postado' : post.status === 'scheduled' ? 'Agendado' : 'Ideia'}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-gray-300'}`}>
                                  {date.toLocaleDateString('pt-BR')}
                                </span>
                                {isOverdue && (
                                  <span className="text-[9px] text-red-500/70 flex items-center gap-1">
                                    <AlertCircle size={10} /> Atrasado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <button className="p-2 text-gray-600 hover:text-white transition">
                                <MoreHorizontal size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-600 text-sm italic">Nenhuma postagem encontrada.</td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        ) : (
          /* FEED VIEW */
          <div className="max-w-4xl mx-auto pb-24">
             <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-12 px-4">
                 <div className="shrink-0 relative">
                     <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                         <div className="w-full h-full rounded-full bg-black p-1">
                             <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                 <div className="text-3xl font-serif text-white italic font-bold">A</div>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                     <div className="flex items-center gap-4">
                         <h2 className="text-xl md:text-2xl text-white font-normal">atlas.2026</h2>
                         <button className="px-4 py-1.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 transition">
                             Editar perfil
                         </button>
                         <Settings size={20} className="text-white cursor-pointer" />
                     </div>
                     
                     <div className="flex gap-8 text-white text-sm md:text-base">
                         <div className="text-center md:text-left"><span className="font-bold">{posts.length}</span> publicações</div>
                         <div className="text-center md:text-left"><span className="font-bold">1.240</span> seguidores</div>
                         <div className="text-center md:text-left"><span className="font-bold">450</span> seguindo</div>
                     </div>

                     <div className="text-white text-sm text-center md:text-left space-y-1">
                         <h3 className="font-bold">Comissão Atlas 2026 🎓</h3>
                         <p className="text-gray-300">Gestão & Excelência</p>
                         <p className="text-gray-300">Transformando sonhos em realidade.</p>
                         <a href="#" className="text-blue-400 font-medium">linktr.ee/atlas2026</a>
                     </div>
                 </div>
             </div>

             <div className="flex gap-4 md:gap-8 overflow-x-auto pb-6 mb-4 px-4 custom-scrollbar">
                 {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                         <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 p-1">
                             <div className="w-full h-full rounded-full bg-zinc-900"></div>
                         </div>
                         <div className="w-12 h-2 bg-zinc-800 rounded-full"></div>
                     </div>
                 ))}
             </div>

             <div className="border-t border-white/10 flex justify-center gap-12 mb-4">
                 <div className="border-t border-white pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white cursor-pointer"><Grid3X3 size={12} /> Publicações</div>
                 <div className="pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-gray-300"><Bookmark size={12} /> Salvos</div>
                 <div className="pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-gray-300"><UserCheck size={12} /> Marcados</div>
             </div>

             <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.sort((a,b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((post) => (
                    <div key={post.id} className="aspect-square bg-zinc-900 relative group overflow-hidden cursor-pointer">
                        {post.image_url ? (
                            <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" />
                        ) : (
                            <PlaceholderImage platform={post.platform} />
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Heart size={20} fill="white" />
                                <span>{post.likes_count}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white font-bold">
                                <MessageCircle size={20} fill="white" />
                                <span>{post.comments_count}</span>
                            </div>
                        </div>

                        {post.status === 'scheduled' && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[8px] font-bold text-copper-light uppercase tracking-widest border border-white/10">
                                Agendado
                            </div>
                        )}
                    </div>
                ))}
                
                {posts.length < 9 && Array(9 - posts.length).fill(0).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-white/[0.02] border border-white/5 flex items-center justify-center">
                        <div className="text-gray-700 opacity-20"><Instagram size={24} /></div>
                    </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* MODAL NOVO POST */}
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
              
              {/* ÁREA DE UPLOAD DE IMAGEM */}
              <div>
                 <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Mídia / Imagem</label>
                 <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                 />
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedFile ? 'border-copper-DEFAULT/50 bg-black' : 'border-white/10 hover:border-copper-DEFAULT/30 hover:bg-white/5'
                    }`}
                 >
                    {selectedFile ? (
                        <img src={URL.createObjectURL(selectedFile)} className="h-full w-full object-contain rounded-xl" />
                    ) : (
                        <>
                           <Upload className="text-gray-500 mb-2" />
                           <span className="text-xs text-gray-500 font-bold uppercase">Clique para carregar</span>
                        </>
                    )}
                 </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Legenda / Caption</label>
                <textarea 
                  required 
                  rows={3} 
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
                  disabled={isUploading}
                  className="flex-1 py-4 bg-copper-gradient text-black font-black rounded-2xl shadow-xl flex justify-center items-center gap-2 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Agendar Conteúdo</>}
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
