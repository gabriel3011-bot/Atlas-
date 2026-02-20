import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ViewProps, MeetingMinute, MeetingLink } from '../types';
import { FileText, Link as LinkIcon, Plus, Download, ExternalLink, Trash2, Upload, Calendar } from 'lucide-react';

const MeetingHub: React.FC<ViewProps> = ({ isEditable }) => {
  const [activeTab, setActiveTab] = useState<'minutes' | 'links'>('minutes');
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [links, setLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDate, setLinkDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const { data: minutesData } = await supabase.from('meeting_minutes').select('*').order('date', { ascending: false });
      if (minutesData) setMinutes(minutesData);

      const { data: linksData } = await supabase.from('meeting_links').select('*').order('date', { ascending: false });
      if (linksData) setLinks(linksData);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      let fileUrl = '';
      if (isSupabaseConfigured()) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('meeting-files')
          .upload(fileName, uploadFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('meeting-files').getPublicUrl(fileName);
        fileUrl = data.publicUrl;

        const { data: newMinute, error: dbError } = await supabase
          .from('meeting_minutes')
          .insert([{ title: uploadTitle, date: uploadDate, file_url: fileUrl }])
          .select();
        
        if (dbError) throw dbError;
        if (newMinute) setMinutes([newMinute[0], ...minutes]);
      }
      
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
    } catch (error) {
      console.error('Error uploading minute:', error);
      alert('Erro ao salvar ata.');
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
      }
      setIsLinkModalOpen(false);
      setLinkTitle('');
      setLinkUrl('');
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Erro ao salvar link.');
    }
  };

  const handleDeleteMinute = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta ata?')) return;
    if (isSupabaseConfigured()) {
      await supabase.from('meeting_minutes').delete().eq('id', id);
      setMinutes(minutes.filter(m => m.id !== id));
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return;
    if (isSupabaseConfigured()) {
      await supabase.from('meeting_links').delete().eq('id', id);
      setLinks(links.filter(l => l.id !== id));
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
                    <a 
                      href={minute.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-copper-light hover:bg-white/5 rounded-lg transition-colors"
                      title="Baixar"
                    >
                      <Download size={18} />
                    </a>
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
    </div>
  );
};

export default MeetingHub;
