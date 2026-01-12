
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { LegalDocument } from '../types';
import { FileText, Download, CheckCircle, Clock, Plus, X, Loader2, FileUp } from 'lucide-react';

const LegalDocs: React.FC = () => {
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', related_party: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('documents').select('*').order('id', { ascending: false });
      if (data) setDocs(data);
    } else {
      setDocs([
        { id: 1, title: 'Contrato Local - Grand Hotel', file_url: '#', status: 'signed', related_party: 'Grand Hotel' },
        { id: 2, title: 'Acordo Serviços DJ', file_url: '#', status: 'pending', related_party: 'DJ Mixer' },
        { id: 3, title: 'Proposta de Segurança', file_url: '#', status: 'pending', related_party: 'SafeGuard Ltda' },
      ]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isSupabaseConfigured()) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('legal-docs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Obter URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('legal-docs')
        .getPublicUrl(filePath);

      // 3. Salvar no Banco de Dados
      const { data: insertedData, error: dbError } = await supabase.from('documents').insert([{
        title: newDoc.title,
        related_party: newDoc.related_party,
        file_url: publicUrl,
        status: 'pending'
      }]).select();

      if (dbError) throw dbError;

      setDocs([insertedData[0], ...docs]);
      setIsModalOpen(false);
      setNewDoc({ title: '', related_party: '' });
      setSelectedFile(null);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar documento. Verifique as políticas do Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewFile = (url: string) => {
    if (url === '#') {
      alert('Este é um documento de exemplo sem arquivo real.');
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="h-full max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-3xl text-white mb-2">Contratos</h2>
          <p className="text-gray-400 font-light">Gestão de documentos legais e assinaturas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-copper-gradient text-black px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-copper-DEFAULT/20 transition hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={18} /> Novo Contrato
        </button>
      </div>
      
      <div className="bg-[#121212] rounded-xl shadow-lg border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                      <th className="p-5">Nome do Documento</th>
                      <th className="p-5">Parte Relacionada</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Ação</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                  {docs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition group">
                          <td className="p-5">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition">
                                      <FileText size={20} />
                                  </div>
                                  <span className="font-medium text-gray-200">{doc.title}</span>
                              </div>
                          </td>
                          <td className="p-5 text-gray-500 font-light">{doc.related_party}</td>
                          <td className="p-5">
                              {doc.status === 'signed' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                      <CheckCircle size={12}/> Assinado
                                  </span>
                              ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                      <Clock size={12}/> Pendente
                                  </span>
                              )}
                          </td>
                          <td className="p-5 text-right">
                              <button 
                                onClick={() => handleViewFile(doc.file_url)}
                                className="text-gray-500 hover:text-copper-light transition p-2 hover:bg-white/5 rounded-full"
                              >
                                  <Download size={18} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {docs.length === 0 && (
              <div className="p-12 text-center text-gray-600 font-serif italic">Nenhum documento encontrado.</div>
          )}
      </div>

      {/* Modal de Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-[#121212] rounded-2xl border border-white/10 w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-serif text-xl text-white italic">Novo Documento</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleUpload} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Título do Contrato</label>
                        <input required type="text" className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none" placeholder="Ex: Contrato de Fotografia" value={newDoc.title} onChange={(e) => setNewDoc({...newDoc, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Parte Relacionada / Fornecedor</label>
                        <input required type="text" className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none" placeholder="Ex: Studio Alpha" value={newDoc.related_party} onChange={(e) => setNewDoc({...newDoc, related_party: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Arquivo PDF</label>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${selectedFile ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 hover:border-copper-DEFAULT/40 bg-[#0a0a0a]'}`}
                        >
                            {selectedFile ? (
                                <>
                                    <FileText className="text-green-500 mb-2" size={32} />
                                    <span className="text-sm text-gray-300 font-medium">{selectedFile.name}</span>
                                    <span className="text-[10px] text-gray-500 mt-1 uppercase">Clique para trocar</span>
                                </>
                            ) : (
                                <>
                                    <FileUp className="text-gray-600 mb-2" size={32} />
                                    <span className="text-sm text-gray-400">Selecionar arquivo PDF</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-lg transition">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={!selectedFile || isUploading}
                            className="flex-1 py-3 bg-copper-gradient text-black font-bold rounded-lg shadow-lg hover:shadow-copper-DEFAULT/20 transition flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Salvar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocs;
