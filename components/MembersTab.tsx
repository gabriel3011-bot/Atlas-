
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Member } from '../types';
import { Plus, MessageCircle, X, Check, User, Phone, MapPin, FileText, Camera, Loader2 } from 'lucide-react';

const MembersTab: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMember, setNewMember] = useState<Partial<Member>>({
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
      // Mock data removido
      setMembers([]);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return;

    setIsUploading(true);
    try {
        let finalPhotoUrl = newMember.photo_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80';

        // 1. Processar Upload se houver arquivo
        if (selectedFile && isSupabaseConfigured()) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('member-avatars')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('member-avatars')
                .getPublicUrl(filePath);
            
            finalPhotoUrl = publicUrl;
        }

        const memberPayload = {
            name: newMember.name,
            role: newMember.role,
            phone: newMember.phone || '',
            photo_url: finalPhotoUrl,
            cpf: newMember.cpf,
            address: newMember.address
        };

        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('committee_members').insert([memberPayload]).select();
            if (error) throw error;
            if (data) setMembers([data[0], ...members]);
        } else {
            const mockMember: Member = { ...memberPayload, id: Date.now() };
            setMembers([mockMember, ...members]);
        }

        setIsModalOpen(false);
        setNewMember({ name: '', role: '', phone: '', photo_url: '', cpf: '', address: '' });
        setSelectedFile(null);
    } catch (err) {
        console.error('Erro ao adicionar membro:', err);
        alert('Erro ao salvar. Verifique se o bucket "member-avatars" existe.');
    } finally {
        setIsUploading(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h2 className="font-serif text-3xl text-white mb-2 tracking-tight italic">Comissão IBMEC 2026</h2>
           <p className="text-gray-400 font-light text-sm">Os pilares da organização Atlas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-copper-gradient text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          <Plus size={20} /> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member) => (
          <div key={member.id} className="group relative bg-[#121212] rounded-2xl border border-white/5 p-6 hover:border-copper-DEFAULT/40 transition-all duration-500 flex flex-col items-center shadow-lg hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-b from-copper-DEFAULT/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 w-24 h-24 mb-4 rounded-full p-1 bg-gradient-to-tr from-copper-dark via-copper-light to-white/10 shadow-xl overflow-hidden">
               <img 
                 src={member.photo_url} 
                 alt={member.name} 
                 className="w-full h-full rounded-full object-cover border-2 border-[#121212]" 
               />
            </div>

            <h3 className="relative z-10 font-serif text-xl text-white font-medium mb-1 drop-shadow-md">{member.name}</h3>
            
            <span className="relative z-10 px-3 py-1 rounded-full bg-copper-DEFAULT/10 border border-copper-DEFAULT/20 text-copper-light text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              {member.role}
            </span>

            <button 
              onClick={() => handleWhatsApp(member.phone)}
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

      {/* Modal Adicionar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-[#121212] rounded-2xl border border-white/10 w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-serif text-xl text-white italic">Cadastrar Novo Membro</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleAddMember} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Upload de Foto */}
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-32 h-32 rounded-full bg-[#0a0a0a] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-copper-DEFAULT/50 group transition-all"
                        >
                            {selectedFile ? (
                                <img src={URL.createObjectURL(selectedFile)} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <>
                                    <Camera size={24} className="text-gray-600 group-hover:text-copper-light transition-colors mb-2" />
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest text-center px-4">Foto do Perfil</span>
                                </>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                                <Plus size={20} className="text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none transition"
                                        placeholder="Nome"
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">CPF</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none"
                                        placeholder="000.000.000-00"
                                        value={newMember.cpf}
                                        onChange={(e) => setNewMember({...newMember, cpf: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Cargo na Comissão</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none"
                                    placeholder="Ex: Presidente, Tesoureiro"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
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
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none"
                                        placeholder="5511999999999"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Endereço</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none"
                                        placeholder="Endereço comercial ou residencial"
                                        value={newMember.address}
                                        onChange={(e) => setNewMember({...newMember, address: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">URL da Foto (ou use upload acima)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none opacity-50"
                                    placeholder="https://..."
                                    value={newMember.photo_url}
                                    onChange={(e) => setNewMember({...newMember, photo_url: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-white/5 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-xl transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isUploading}
                            className="flex-1 py-3 bg-copper-gradient text-black font-bold rounded-xl shadow-lg hover:shadow-copper-DEFAULT/20 transition flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Salvar Membro</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MembersTab;
