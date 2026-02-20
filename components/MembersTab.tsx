
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Member, ViewProps } from '../types';
import { Plus, MessageCircle, X, Check, User, Phone, MapPin, FileText, Camera, Loader2, Trash2, AlertTriangle, Save, PenLine, Download } from 'lucide-react';

interface MembersTabProps extends ViewProps {}

const MembersTab: React.FC<MembersTabProps> = ({ isEditable }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Se editingId for null, é modo Criação. Se tiver ID, é modo Edição.
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    role: '',
    phone: '',
    photo_url: '',
    cpf: '',
    address: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('committee_members').select('*').order('id', { ascending: false });
      if (data) setMembers(data);
    } else {
      setMembers([]);
    }
  };

  const openNewMemberModal = () => {
      setEditingId(null);
      setFormData({ name: '', role: '', phone: '', photo_url: '', cpf: '', address: '' });
      setSelectedFile(null);
      setIsModalOpen(true);
  };

  const openEditMemberModal = (member: Member) => {
      setEditingId(member.id);
      setFormData({ 
          name: member.name, 
          role: member.role, 
          phone: member.phone, 
          photo_url: member.photo_url, 
          cpf: member.cpf, 
          address: member.address 
      });
      setSelectedFile(null);
      setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    setIsUploading(true);
    try {
        let finalPhotoUrl = formData.photo_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80';

        // Se houver arquivo selecionado, faz upload e atualiza a URL
        if (selectedFile && isSupabaseConfigured()) {
            // Preview local imediato se upload falhar (fallback)
            finalPhotoUrl = URL.createObjectURL(selectedFile);

            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('member-avatars')
                .upload(filePath, selectedFile);

            if (uploadError) {
                 console.error("Upload member avatar error:", uploadError);
                 const errorMsg = uploadError.message || JSON.stringify(uploadError);
                 alert(`Aviso: Upload da foto falhou (${errorMsg}). Usando versão local temporária.`);
            } else {
                 const { data: { publicUrl } } = supabase.storage
                    .from('member-avatars')
                    .getPublicUrl(filePath);
                
                finalPhotoUrl = publicUrl;
            }
        }

        const memberPayload = {
            name: formData.name,
            role: formData.role,
            phone: formData.phone || '',
            photo_url: finalPhotoUrl,
            cpf: formData.cpf,
            address: formData.address
        };

        if (isSupabaseConfigured()) {
            if (editingId) {
                // UPDATE
                const { data, error } = await supabase
                    .from('committee_members')
                    .update(memberPayload)
                    .eq('id', editingId)
                    .select();
                
                if (error) throw error;
                if (data) {
                    setMembers(prev => prev.map(m => m.id === editingId ? data[0] : m));
                }
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('committee_members')
                    .insert([memberPayload])
                    .select();
                
                if (error) throw error;
                if (data) setMembers([data[0], ...members]);
            }
        } else {
            // Modo Offline / Fallback
            if (editingId) {
                setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...memberPayload } : m));
            } else {
                const mockMember: Member = { ...memberPayload, id: Date.now() } as Member;
                setMembers([mockMember, ...members]);
            }
        }

        setIsModalOpen(false);
        setFormData({ name: '', role: '', phone: '', photo_url: '', cpf: '', address: '' });
        setSelectedFile(null);
        setEditingId(null);
    } catch (err) {
        console.error('Erro ao salvar membro:', err);
        const errorMessage = (err as any).message || String(err);
        alert(`Erro ao salvar membro: ${errorMessage}`);
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteMember = async () => {
      if (!memberToDelete) return;
      
      try {
          if (isSupabaseConfigured()) {
              const { error } = await supabase.from('committee_members').delete().eq('id', memberToDelete.id);
              if (error) throw error;
          }
          
          setMembers(members.filter(m => m.id !== memberToDelete.id));
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
          setIsModalOpen(false); // Fecha modal de edição se estiver aberto no delete
      } catch (err) {
          console.error("Erro ao deletar membro:", err);
          alert("Erro ao excluir membro.");
      }
  };

  const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede abrir o modal de edição
    if (!phone) return;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const downloadMembersList = () => {
    if (members.length === 0) {
      alert("Nenhum membro para baixar.");
      return;
    }

    const content = members.map(m => `Nome: ${m.name}\nCPF: ${m.cpf || 'Não informado'}\nCargo: ${m.role}\nWhatsApp: ${m.phone || 'Não informado'}\n--------------------------`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista_membros_atlas_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h2 className="font-serif text-3xl text-white mb-2 tracking-tight italic">Comissão IBMEC 2026</h2>
           <p className="text-gray-400 font-light text-sm">Os pilares da organização Atlas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadMembersList}
            className="bg-white/5 text-white px-4 md:px-6 py-3 rounded-lg font-bold flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-all duration-300"
            title="Baixar lista de membros (TXT)"
          >
            <Download size={20} /> <span className="hidden md:inline">Baixar Lista</span>
          </button>
          {isEditable && (
            <button 
              onClick={openNewMemberModal}
              className="bg-copper-gradient text-black px-4 md:px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              <Plus size={20} /> <span className="hidden md:inline">Adicionar Membro</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member) => (
          <div 
            key={member.id} 
            onClick={() => openEditMemberModal(member)}
            className="group relative bg-[#121212] rounded-2xl border border-white/5 p-6 hover:border-copper-DEFAULT/40 transition-all duration-500 flex flex-col items-center shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-copper-DEFAULT/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Ícone de Edição (Visual Hint) */}
            <div className="absolute top-3 left-3 text-copper-light opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditable ? <PenLine size={16} /> : <User size={16} />}
            </div>

            {/* Botão de Excluir (Visível se editável e hover) */}
            {isEditable && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setMemberToDelete(member);
                        setIsDeleteModalOpen(true);
                    }}
                    className="absolute top-3 right-3 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="relative z-10 w-24 h-24 mb-4 rounded-full p-1 bg-gradient-to-tr from-copper-dark via-copper-light to-white/10 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
               <img 
                 src={member.photo_url} 
                 alt={member.name} 
                 className="w-full h-full rounded-full object-cover border-2 border-[#121212]" 
               />
            </div>

            <h3 className="relative z-10 font-serif text-xl text-white font-medium mb-1 drop-shadow-md text-center">{member.name}</h3>
            
            <span className="relative z-10 px-3 py-1 rounded-full bg-copper-DEFAULT/10 border border-copper-DEFAULT/20 text-copper-light text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              {member.role}
            </span>

            <button 
              onClick={(e) => handleWhatsApp(member.phone, e)}
              className="relative z-10 w-full py-2.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-gray-400 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/5 transition-all group/btn"
            >
              <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform"/>
              <span className="text-sm font-semibold">Mensagem</span>
            </button>
          </div>
        ))}
        {members.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                <User size={48} className="text-gray-700 mb-4" />
                <p className="text-gray-500 font-serif italic text-lg">Nenhum membro cadastrado.</p>
            </div>
        )}
      </div>

      {/* Modal Adicionar/Editar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-[#121212] rounded-2xl border border-white/10 w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <User className="text-copper-light" size={24} />
                        <h3 className="font-serif text-xl text-white italic">
                            {editingId ? 'Detalhes do Membro' : 'Cadastrar Novo Membro'}
                        </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSaveMember} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Upload de Foto */}
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            onClick={() => isEditable && fileInputRef.current?.click()}
                            className={`relative w-32 h-32 rounded-full bg-[#0a0a0a] border-2 border-dashed flex flex-col items-center justify-center transition-all ${isEditable ? 'cursor-pointer hover:border-copper-DEFAULT/50 group border-white/10' : 'cursor-default border-white/5 opacity-90'}`}
                        >
                            {(selectedFile || formData.photo_url) ? (
                                <img 
                                    src={selectedFile ? URL.createObjectURL(selectedFile) : formData.photo_url} 
                                    className="w-full h-full rounded-full object-cover" 
                                />
                            ) : (
                                <>
                                    <Camera size={24} className="text-gray-600 mb-2" />
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest text-center px-4">Foto</span>
                                </>
                            )}
                            
                            {isEditable && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                                    <PenLine size={20} className="text-white" />
                                </div>
                            )}
                        </div>
                        {isEditable && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        required
                                        disabled={!isEditable}
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="Nome"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">CPF</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        type="text" 
                                        disabled={!isEditable}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none disabled:opacity-50"
                                        placeholder="000.000.000-00"
                                        value={formData.cpf}
                                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Cargo na Comissão</label>
                                <input 
                                    required
                                    disabled={!isEditable}
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none disabled:opacity-50"
                                    placeholder="Ex: Presidente, Tesoureiro"
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        required
                                        disabled={!isEditable}
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none disabled:opacity-50"
                                        placeholder="5511999999999"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Endereço</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        type="text" 
                                        disabled={!isEditable}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none disabled:opacity-50"
                                        placeholder="Endereço comercial ou residencial"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>
                            {isEditable && (
                                <div>
                                    <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">URL da Foto (Opcional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none opacity-50 text-xs"
                                        placeholder="https://... (Preenchido auto se fizer upload)"
                                        value={formData.photo_url}
                                        onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-white/5 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-xl transition"
                        >
                            {isEditable ? 'Cancelar' : 'Fechar'}
                        </button>
                        
                        {isEditable && (
                            <button 
                                type="submit" 
                                disabled={isUploading}
                                className="flex-1 py-3 bg-copper-gradient text-black font-bold rounded-xl shadow-lg hover:shadow-copper-DEFAULT/20 transition flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {editingId ? 'Salvar Alterações' : 'Criar Membro'}</>}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
              <div className="bg-[#18181b] rounded-2xl border border-red-500/20 w-full max-w-sm relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="font-serif text-2xl text-white mb-2">Remover Membro?</h3>
                      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                          Você tem certeza que deseja remover <strong className="text-white">{memberToDelete?.name}</strong> da comissão? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-xl transition">Cancelar</button>
                          <button onClick={handleDeleteMember} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition transform active:scale-95">Excluir</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MembersTab;
