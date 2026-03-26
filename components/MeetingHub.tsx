import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ViewProps, MeetingMinute, MeetingLink } from '../types';
import { FileText, Link as LinkIcon, Plus, Download, ExternalLink, Trash2, Upload, Calendar, Eye, X } from 'lucide-react';

const MeetingHub: React.FC<ViewProps> = ({ isEditable }) => {
  const [activeTab, setActiveTab] = useState<'minutes' | 'links'>('minutes');
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [links, setLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Minute State
  const [viewMinute, setViewMinute] = useState<MeetingMinute | null>(null);

  // Link State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDate, setLinkDate] = useState(new Date().toISOString().split('T')[0]);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<{type: 'minute' | 'link', id: number} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let loadedMinutes: MeetingMinute[] = [];
    let loadedLinks: MeetingLink[] = [];
    
    if (isSupabaseConfigured()) {
      try {
        const { data: minutesData, error: minutesError } = await supabase.from('meeting_minutes').select('*').order('date', { ascending: false });
        if (minutesData) loadedMinutes = minutesData;
        if (minutesError) throw minutesError;
      } catch (error) {
        console.error("Error fetching minutes from Supabase:", error);
      }

      try {
        const { data: linksData, error: linksError } = await supabase.from('meeting_links').select('*').order('date', { ascending: false });
        if (linksData) loadedLinks = linksData;
        if (linksError) throw linksError;
      } catch (error) {
        console.error("Error fetching links from Supabase:", error);
      }
    }
    
    // Load local fallback minutes and merge
    const localMinutesStr = localStorage.getItem('localMinutes');
    if (localMinutesStr) {
      try {
        const localMinutes: MeetingMinute[] = JSON.parse(localMinutesStr);
        // Merge local minutes that don't exist in Supabase
        const existingIds = new Set(loadedMinutes.map(m => m.id));
        const newLocalMinutes = localMinutes.filter(m => !existingIds.has(m.id));
        loadedMinutes = [...newLocalMinutes, ...loadedMinutes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        console.error("Error parsing local minutes", e);
      }
    }
    
    // Load local fallback links and merge
    const localLinksStr = localStorage.getItem('localLinks');
    if (localLinksStr) {
      try {
        const localLinks: MeetingLink[] = JSON.parse(localLinksStr);
        const existingIds = new Set(loadedLinks.map(l => l.id));
        const newLocalLinks = localLinks.filter(l => !existingIds.has(l.id));
        loadedLinks = [...newLocalLinks, ...loadedLinks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        console.error("Error parsing local links", e);
      }
    }
    
    setMinutes(loadedMinutes);
    setLinks(loadedLinks);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSupabaseConfigured()) {
        let newMinuteData: any = { title: uploadTitle, date: uploadDate };

        if (uploadMode === 'file') {
          if (!uploadFile) {
            alert('Selecione um arquivo.');
            return;
          }
          const fileExt = uploadFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('meeting-files')
            .upload(fileName, uploadFile);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('meeting-files').getPublicUrl(fileName);
          newMinuteData.file_url = data.publicUrl;
        } else {
          if (!uploadContent.trim()) {
            alert('Digite o conteúdo da ata.');
            return;
          }
          newMinuteData.content = uploadContent;
        }

        const { data: newMinute, error: dbError } = await supabase
          .from('meeting_minutes')
          .insert([newMinuteData])
          .select();
        
        if (dbError) throw dbError;
        if (newMinute) setMinutes([newMinute[0], ...minutes]);
      } else {
        throw new Error("Supabase is not configured");
      }
      
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadContent('');
      setUploadTitle('');
      setUploadMode('file');
    } catch (error: any) {
      console.error('Error uploading minute:', error);
      if (isSupabaseConfigured()) {
        alert(`Erro ao salvar ata: ${error.message || 'Verifique se a coluna "content" existe na tabela meeting_minutes.'}`);
      }
      
      // Fallback local para não travar o uso
      const fallbackMinute: MeetingMinute = {
        id: Date.now(),
        title: uploadTitle,
        date: uploadDate,
        content: uploadMode === 'text' ? uploadContent : undefined,
        file_url: uploadMode === 'file' ? 'local-file' : undefined
      };
      const newMinutes = [fallbackMinute, ...minutes];
      setMinutes(newMinutes);
      
      // Save local fallback
      const existingStr = localStorage.getItem('localMinutes');
      let localMinutes = [];
      if (existingStr) {
        try { localMinutes = JSON.parse(existingStr); } catch (e) {}
      }
      localMinutes = [fallbackMinute, ...localMinutes];
      localStorage.setItem('localMinutes', JSON.stringify(localMinutes));
      
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadContent('');
      setUploadTitle('');
      setUploadMode('file');
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSupabaseConfigured()) {
        const { data: newLink, error } = await supabase
          .from('meeting_links')
          .insert([{ title: linkTitle, url: linkUrl, date: linkDate }])
          .select();
        
        if (error) throw error;
        if (newLink) setLinks([newLink[0], ...links]);
      } else {
        throw new Error("Supabase is not configured");
      }
      setIsLinkModalOpen(false);
      setLinkTitle('');
      setLinkUrl('');
    } catch (error) {
      console.error('Error adding link:', error);
      if (isSupabaseConfigured()) {
        alert('Erro ao salvar link.');
      }
      
      const fallbackLink: MeetingLink = {
        id: Date.now(),
        title: linkTitle,
        url: linkUrl,
        date: linkDate
      };
      
      const newLinks = [fallbackLink, ...links];
      setLinks(newLinks);
      
      const existingStr = localStorage.getItem('localLinks');
      let localLinks = [];
      if (existingStr) {
        try { localLinks = JSON.parse(existingStr); } catch (e) {}
      }
      localLinks = [fallbackLink, ...localLinks];
      localStorage.setItem('localLinks', JSON.stringify(localLinks));
      
      setIsLinkModalOpen(false);
      setLinkTitle('');
      setLinkUrl('');
    }
  };

  const handleDeleteMinute = (id: number) => {
    setItemToDelete({ type: 'minute', id });
  };

  const handleDeleteLink = (id: number) => {
    setItemToDelete({ type: 'link', id });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'minute') {
        if (isSupabaseConfigured()) {
          try {
            await supabase.from('meeting_minutes').delete().eq('id', itemToDelete.id);
          } catch (e) {
            console.error("Error deleting from supabase", e);
          }
        }
        const updatedMinutes = minutes.filter(m => m.id !== itemToDelete.id);
        setMinutes(updatedMinutes);
        
        // Also remove from local storage if it exists there
        const localMinutesStr = localStorage.getItem('localMinutes');
        if (localMinutesStr) {
          try {
            const localMinutes: any[] = JSON.parse(localMinutesStr);
            const updatedLocalMinutes = localMinutes.filter(m => m.id !== itemToDelete.id);
            localStorage.setItem('localMinutes', JSON.stringify(updatedLocalMinutes));
          } catch (e) {
            console.error("Error updating local minutes on delete", e);
          }
        }
      } else {
        if (isSupabaseConfigured()) {
          try {
            await supabase.from('meeting_links').delete().eq('id', itemToDelete.id);
          } catch (e) {
            console.error("Error deleting link from supabase", e);
          }
        }
        const updatedLinks = links.filter(l => l.id !== itemToDelete.id);
        setLinks(updatedLinks);
        
        // Also remove from local storage if it exists there
        const localLinksStr = localStorage.getItem('localLinks');
        if (localLinksStr) {
          try {
            const localLinks: any[] = JSON.parse(localLinksStr);
            const updatedLocalLinks = localLinks.filter(l => l.id !== itemToDelete.id);
            localStorage.setItem('localLinks', JSON.stringify(updatedLocalLinks));
          } catch (e) {
            console.error("Error updating local links on delete", e);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-white italic tracking-tight">Hub de Reuniões</h2>
          <p className="text-gray-500 font-light text-sm">Central de atas e links importantes.</p>
        </div>
      </div>

      <div className="flex border-b border-white/5 space-x-8 mb-8">
        <button 
          onClick={() => setActiveTab('minutes')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'minutes' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <FileText size={16} />
          Atas & Documentos
          {activeTab === 'minutes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('links')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'links' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <LinkIcon size={16} />
          Links de Reunião
          {activeTab === 'links' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'minutes' ? (
          <div className="space-y-6">
            {isEditable && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-copper-light hover:border-copper-DEFAULT/30 transition-all group"
              >
                <Upload size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Nova Ata</span>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {minutes.map(minute => (
                <div key={minute.id} className="bg-[#121212] border border-white/10 rounded-xl p-5 flex items-center justify-between group hover:border-copper-DEFAULT/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-lg text-gray-400 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{minute.title}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={10} /> {new Date(minute.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {minute.content ? (
                      <button 
                        onClick={() => setViewMinute(minute)}
                        className="p-2 text-gray-500 hover:text-copper-light hover:bg-white/5 rounded-lg transition-colors"
                        title="Ler Ata"
                      >
                        <Eye size={18} />
                      </button>
                    ) : minute.file_url ? (
                      <a 
                        href={minute.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-copper-light hover:bg-white/5 rounded-lg transition-colors"
                        title="Baixar"
                      >
                        <Download size={18} />
                      </a>
                    ) : null}
                    {isEditable && (
                      <button 
                        onClick={() => handleDeleteMinute(minute.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {minutes.length === 0 && !loading && (
                <div className="col-span-full text-center py-10 text-gray-500 text-sm">Nenhuma ata encontrada.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isEditable && (
              <button 
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-copper-light hover:border-copper-DEFAULT/30 transition-all group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Novo Link</span>
              </button>
            )}

            <div className="grid grid-cols-1 gap-4">
              {links.map(link => (
                <div key={link.id} className="bg-[#121212] border border-white/10 rounded-xl p-5 flex items-center justify-between group hover:border-copper-DEFAULT/30 transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                      <LinkIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{link.title}</h4>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block mt-1">
                        {link.url}
                      </a>
                      <p className="text-[10px] text-gray-600 mt-1">
                        Data: {new Date(link.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      Acessar <ExternalLink size={12} />
                    </a>
                    {isEditable && (
                      <button 
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
               {links.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500 text-sm">Nenhum link cadastrado.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Nova Ata</h3>
            
            <div className="flex bg-black/50 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${uploadMode === 'file' ? 'bg-copper-DEFAULT text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Arquivo
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${uploadMode === 'text' ? 'bg-copper-DEFAULT text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Texto
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Data</label>
                <input 
                  type="date" 
                  required
                  value={uploadDate}
                  onChange={e => setUploadDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none [color-scheme:dark]"
                />
              </div>
              
              {uploadMode === 'file' ? (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Arquivo (PDF/Doc)</label>
                  <input 
                    type="file" 
                    required
                    ref={fileInputRef}
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Conteúdo da Ata</label>
                  <textarea 
                    required
                    value={uploadContent}
                    onChange={e => setUploadContent(e.target.value)}
                    rows={6}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none resize-none"
                    placeholder="Digite os pontos discutidos na reunião..."
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-copper-DEFAULT text-white rounded-lg font-bold text-sm hover:bg-copper-light transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Novo Link</h3>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">URL</label>
                <input 
                  type="url" 
                  required
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Data da Reunião</label>
                <input 
                  type="date" 
                  required
                  value={linkDate}
                  onChange={e => setLinkDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-copper-DEFAULT outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsLinkModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-copper-DEFAULT text-white rounded-lg font-bold text-sm hover:bg-copper-light transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-400 text-sm mb-6">
              Tem certeza que deseja excluir {itemToDelete.type === 'minute' ? 'esta ata' : 'este link'}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)} 
                className="flex-1 py-3 text-gray-400 hover:text-white font-bold text-sm bg-white/5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-sm transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Minute Modal */}
      {viewMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{viewMinute.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(viewMinute.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setViewMinute(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-4 border border-white/5 whitespace-pre-wrap text-sm text-gray-300">
              {viewMinute.content}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewMinute(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingHub;
