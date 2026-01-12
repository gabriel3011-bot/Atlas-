
import React, { useState, useMemo, useRef } from 'react';
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
  View as ViewIcon,
  Upload,
  FileUp,
  Loader2
} from 'lucide-react';
import { MarketingPost, MarketingStatus } from '../types';

type MarketingViewMode = 'calendar' | 'feed';

const MarketingGrid: React.FC = () => {
  const [activeView, setActiveView] = useState<MarketingViewMode>('calendar');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<MarketingPost[]>([
    { 
      id: 1, 
      image_url: 'https://images.unsplash.com/photo-1519671482502-9759101d4561?auto=format&fit=crop&w=800&q=80', 
      caption: 'A contagem regressiva começou. Atlas 2026 está chegando para mudar tudo. 🎓✨', 
      scheduled_date: '2024-03-05', 
      platform: 'Instagram', 
      status: 'posted', 
      likes_count: 1240, 
      comments_count: 56 
    },
    { 
      id: 2, 
      image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80', 
      caption: 'Bastidores da nossa última reunião técnica. O nível de entrega será sem precedentes.', 
      scheduled_date: '2024-03-12', 
      platform: 'TikTok', 
      status: 'posted', 
      likes_count: 890, 
      comments_count: 32 
    },
    { 
      id: 3, 
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 
      caption: 'Moodboard: Minimalismo e Sofisticação. Escolha o seu detalhe favorito nos comentários.', 
      scheduled_date: '2024-03-20', 
      platform: 'Instagram', 
      status: 'scheduled', 
      likes_count: 0, 
      comments_count: 0 
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({
    caption: '',
    platform: 'Instagram',
    scheduled_date: new Date().toISOString().split('T')[0],
  });

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startPadding; i++) days.push(null);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({ day: i, date: dateStr });
    }
    return days;
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    // 1. Prevenir recarregamento da página
    e.preventDefault();
    
    if (!selectedFile && !previewUrl) {
      alert("Por favor, selecione uma imagem para o post.");
      return;
    }

    setIsUploading(true);

    try {
      // Valor inicial é o preview local (Optimistic UI) ou placeholder
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';

      // Tenta upload real se Supabase estiver configurado
      if (selectedFile && isSupabaseConfigured()) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('marketing')
          .upload(filePath, selectedFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('marketing')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        } else {
          console.warn("Upload falhou, mantendo preview local:", uploadError.message);
        }
      }

      // 2. Criar objeto de post imediatamente
      const newPost: MarketingPost = {
        id: Date.now(),
        image_url: finalImageUrl,
        caption: newPostData.caption || 'Sem legenda.',
        scheduled_date: newPostData.scheduled_date,
        platform: newPostData.platform,
        status: 'scheduled',
        likes_count: 0,
        comments_count: 0
      };

      // 3. Atualização imediata do estado (Adiciona ao topo)
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      
      // 4. Fechar modal e limpar estados imediatamente
      setIsAddModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewPostData({
        caption: '',
        platform: 'Instagram',
        scheduled_date: new Date().toISOString().split('T')[0],
      });

    } catch (err) {
      console.error("Erro crítico ao salvar post:", err);
      alert("Houve um problema ao processar seu post. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const getPostsForDate = (date: string) => posts.filter(p => p.scheduled_date === date);

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

      {/* Main Content Area */}
      <div className="flex-1">
        {activeView === 'calendar' ? (
          /* STRATEGIC CALENDAR VIEW */
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-x-auto custom-scrollbar h-fit">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 mb-6">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
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
                              {post.status === 'posted' && <Check size={8} className="text-green-500 ml-auto shrink-0" />}
                            </div>
                          ))}
                        </div>

                        {getPostsForDate(dayObj.date).length === 0 && (
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
        ) : (
          /* SOCIAL FEED VIEW */
          <div className="max-w-xl mx-auto space-y-8 pb-24">
            {posts.sort((a,b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((post) => (
              <div key={post.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-copper-dark via-copper-light to-white p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">A</div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-white">atlas.2026</h4>
                      <p className="text-[9px] text-gray-500 flex items-center gap-1 font-bold">
                        {post.platform === 'Instagram' ? <Instagram size={10} /> : <Smartphone size={10} />}
                        {new Date(post.scheduled_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <MoreHorizontal size={20} className="text-gray-600 cursor-pointer hover:text-white transition-colors" />
                </div>

                <div className="aspect-square relative group">
                  <img src={post.image_url} alt="Post Content" className="w-full h-full object-cover" />
                  {post.status === 'scheduled' && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                      <Clock size={12} className="text-copper-light" />
                      <span className="text-[8px] font-black uppercase text-white tracking-widest">Agendado</span>
                    </div>
                  )}
                </div>

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
                      {post.caption}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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

            <form onSubmit={handleAddPost} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Image Upload Area */}
              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-3">Mídia / Imagem</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group h-48 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    previewUrl ? 'border-copper-DEFAULT/40 bg-black/40' : 'border-white/10 hover:border-copper-DEFAULT/30 bg-black/20'
                  }`}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={24} className="text-white" />
                        <span className="ml-2 text-[10px] font-black text-white uppercase tracking-widest">Trocar Imagem</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center px-6">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-copper-DEFAULT/10 group-hover:scale-110 transition-all">
                        <FileUp className="text-gray-500 group-hover:text-copper-light" size={24} />
                      </div>
                      <p className="text-xs font-bold text-gray-400 group-hover:text-white">📁 Clique para selecionar uma foto</p>
                      <p className="text-[8px] text-gray-600 mt-1 uppercase tracking-tighter">Formato recomendado: JPG ou PNG (1:1)</p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Legenda / Caption</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-copper-DEFAULT outline-none resize-none italic text-sm" 
                  placeholder="Conte a história por trás deste post..." 
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none [color-scheme:dark] text-xs font-bold" 
                    value={newPostData.scheduled_date} 
                    onChange={e => setNewPostData({...newPostData, scheduled_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Plataforma</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none text-xs font-bold cursor-pointer" 
                    value={newPostData.platform} 
                    onChange={e => setNewPostData({...newPostData, platform: e.target.value})}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="flex-1 py-4 text-gray-500 font-bold hover:bg-white/5 rounded-2xl transition"
                >
                  Descartar
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="flex-1 py-4 bg-copper-gradient text-black font-black rounded-2xl shadow-xl flex justify-center items-center gap-2 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span className="uppercase text-[10px] tracking-widest">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} /> 
                      <span className="uppercase text-[10px] tracking-widest">Agendar Conteúdo</span>
                    </>
                  )}
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
