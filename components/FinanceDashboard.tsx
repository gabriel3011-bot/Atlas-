import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Calculator, PieChart as PieIcon, ArrowRight, Plus, Upload, 
  FileText, X, ChevronDown, ChevronUp, Database, BarChart3, List, Scale, Power, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

type EventCost = {
  id: number;
  event_name: string;
  category: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  receipt_url: string | null;
  status: string;
};

const ABAS = ['Lançamento', 'Pré-Evento 1', 'Pré-Evento 2', 'Baile', 'Ativações', 'Geral'];
const CORES_GRAFICO = ['#d4a373', '#b87333', '#e9c46a', '#2a9d8f', '#e76f51', '#264653', '#8ab17d', '#f4a261', '#219ebc'];

export default function FinanceDashboard({ isEditable = true }) {
  const [activeTab, setActiveTab] = useState('Baile');
  const [viewMode, setViewMode] = useState<'list' | 'charts' | 'compare'>('list');
  
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para a SIMULAÇÃO (quais itens estão "ligados")
  const [activeItems, setActiveItems] = useState<Record<number, boolean>>({});

  // Estados para Comparação
  const [compareEvent1, setCompareEvent1] = useState('Baile');
  const [compareEvent2, setCompareEvent2] = useState('Pré-Evento 1');

  // Estados de Upload de Comprovante
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<EventCost | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeEventName = (name: string): string => {
    if (!name) return 'Geral';
    const normalized = name.toUpperCase().trim();
    if (normalized.includes('PRÉ EVENTO 1')) return 'Pré-Evento 1';
    if (normalized.includes('PRÉ EVENTO 2')) return 'Pré-Evento 2';
    if (normalized.includes('LANÇAMENTO')) return 'Lançamento';
    if (normalized.includes('BAILE')) return 'Baile';
    if (normalized.includes('BENEFÍCIOS') || normalized.includes('MKT')) return 'Ativações';
    return 'Geral';
  };

  const fetchData = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const { data: orcamentoData } = await supabase.from('Orçamento').select('*');
      
      if (orcamentoData) {
        const formatado = orcamentoData.map((item: any) => ({
          id: item.id,
          event_name: normalizeEventName(item.Evento),
          category: item.Categoria || 'Geral',
          item_name: item.Item,
          quantity: item.Qtd || 1,
          unit_price: item['Preço Unitário'] || 0,
          total_price: item['Preço Total'] || 0,
          receipt_url: item.nota_fiscal_url,
          status: item.nota_fiscal_url ? 'paid' : 'pending'
        }));
        
        setEventCosts(formatado);

        // Inicia a simulação com todos os itens LIGADOS (true)
        const initialActiveState: Record<number, boolean> = {};
        formatado.forEach((item: any) => {
          initialActiveState[item.id] = true;
        });
        setActiveItems(initialActiveState);
      }
    }
    setLoading(false);
  };

  const toggleItemSimulation = (id: number) => {
    setActiveItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCost || !receiptFile) return;

    try {
      let fileUrl = '';
      if (isSupabaseConfigured()) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `receipt_${selectedCost.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('finance-receipts').upload(fileName, receiptFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('finance-receipts').getPublicUrl(fileName);
        fileUrl = data.publicUrl;

        const { error: updateError } = await supabase
          .from('Orçamento')
          .update({ nota_fiscal_url: fileUrl })
          .eq('id', selectedCost.id);

        if (updateError) throw updateError;
        
        await fetchData(); 
      }
      setIsReceiptModalOpen(false);
      setSelectedCost(null);
      setReceiptFile(null);
    } catch (error) {
      console.error('Receipt upload error:', error);
      alert('Erro ao enviar comprovante. Verifique se o bucket "finance-receipts" existe e é público.');
    }
  };

  // --- LÓGICA DE DADOS (FILTROS E SIMULAÇÕES) ---

  const costsForActiveTab = useMemo(() => eventCosts.filter(c => c.event_name === activeTab), [eventCosts, activeTab]);
  
  const budgetOriginal = costsForActiveTab.reduce((acc, c) => acc + Number(c.total_price), 0);
  const budgetSimulado = costsForActiveTab.reduce((acc, c) => acc + (activeItems[c.id] ? Number(c.total_price) : 0), 0);

  const groupedCosts = useMemo(() => {
    const groups: Record<string, EventCost[]> = {};
    costsForActiveTab.forEach(cost => {
      // Nos gráficos, ignoramos os itens desativados na simulação
      if (viewMode !== 'list' && !activeItems[cost.id]) return;
      
      if (!groups[cost.category]) groups[cost.category] = [];
      groups[cost.category].push(cost);
    });
    return groups;
  }, [costsForActiveTab, activeItems, viewMode]);

  const chartData = useMemo(() => {
    return Object.entries(groupedCosts).map(([category, items]) => ({
      name: category,
      valor: items.reduce((acc, i) => acc + (activeItems[i.id] ? Number(i.total_price) : 0), 0)
    })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [groupedCosts, activeItems]);

  const compareData = useMemo(() => {
    const event1Total = eventCosts.filter(c => c.event_name === compareEvent1 && activeItems[c.id]).reduce((a, b) => a + Number(b.total_price), 0);
    const event2Total = eventCosts.filter(c => c.event_name === compareEvent2 && activeItems[c.id]).reduce((a, b) => a + Number(b.total_price), 0);
    return [
      { name: compareEvent1, Total: event1Total },
      { name: compareEvent2, Total: event2Total }
    ];
  }, [eventCosts, compareEvent1, compareEvent2, activeItems]);


  return (
    <div className="h-full flex flex-col space-y-6 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* HEADER E ABAS DE EVENTOS */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-3xl text-white italic tracking-tight">Análise Financeira</h2>
          {isEditable && (
            <button 
              onClick={fetchData}
              className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Database size={18} /> Sincronizar Banco
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2">
          {ABAS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-[#d4a373] text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-MENU DE VISÕES (Lista, Gráficos, Comparar) */}
      <div className="flex gap-4 p-1 bg-white/5 rounded-xl w-fit">
        <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-[#121212] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
          <List size={16} /> Lista & Simulador
        </button>
        <button onClick={() => setViewMode('charts')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'charts' ? 'bg-[#121212] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
          <PieIcon size={16} /> Gráficos
        </button>
        <button onClick={() => setViewMode('compare')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'compare' ? 'bg-[#121212] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
          <Scale size={16} /> Comparar Eventos
        </button>
      </div>

      {/* PAINEL DE TOTAIS DO SIMULADOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Orçamento Original</span>
           <h3 className="text-3xl font-serif font-bold text-gray-400 italic">
             R$ {budgetOriginal.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className={`bg-[#121212] border rounded-2xl p-6 shadow-xl transition-colors ${budgetSimulado !== budgetOriginal ? 'border-[#d4a373]' : 'border-white/10'}`}>
           <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${budgetSimulado !== budgetOriginal ? 'text-[#d4a373]' : 'text-gray-500'}`}>
             Total da Simulação
           </span>
           <h3 className="text-3xl font-serif font-bold text-white italic flex items-center gap-4">
             R$ {budgetSimulado.toLocaleString('pt-BR')}
             {budgetSimulado < budgetOriginal && (
                <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-sans not-italic">
                  Economia: R$ {(budgetOriginal - budgetSimulado).toLocaleString('pt-BR')}
                </span>
             )}
           </h3>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO BASEADO NO VIEW MODE */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-xl min-h-[500px]">
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4a373]"></div>
          </div>
        ) : (
          <>
            {/* --- MODO: LISTA E SIMULADOR --- */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-xl text-white italic">Ativar/Desativar itens para simular o orçamento</h3>
                </div>
                {Object.entries(groupedCosts).length > 0 ? (
                  Object.entries(groupedCosts).map(([category, items]) => (
                    <div key={category} className="border border-white/5 rounded-xl overflow-hidden mb-4">
                      <button onClick={() => toggleCategory(category)} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white uppercase tracking-wider">{category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono text-gray-400">
                            R$ {items.reduce((acc, i) => acc + (activeItems[i.id] ? Number(i.total_price) : 0), 0).toLocaleString('pt-BR')}
                          </span>
                          {expandedCategories[category] ? <ChevronUp size={16} className="text-white"/> : <ChevronDown size={16} className="text-white"/>}
                        </div>
                      </button>
                      
                      {expandedCategories[category] && (
                        <div className="p-4 space-y-2 bg-black/20">
                          {items.map(item => (
                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${activeItems[item.id] ? 'bg-white/5 border-white/5' : 'bg-black/50 border-red-500/20 opacity-50'}`}>
                              <div className="flex items-center gap-4">
                                {/* BOTÃO DE LIGAR/DESLIGAR (SIMULADOR) */}
                                <button 
                                  onClick={() => toggleItemSimulation(item.id)}
                                  className={`p-2 rounded-full transition-colors ${activeItems[item.id] ? 'bg-green-500/20 text-green-500 hover:bg-green-500/40' : 'bg-red-500/20 text-red-500 hover:bg-red-500/40'}`}
                                  title={activeItems[item.id] ? "Remover da simulação" : "Incluir na simulação"}
                                >
                                  <Power size={18} />
                                </button>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-medium ${activeItems[item.id] ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{item.item_name}</span>
                                  <span className="text-[10px] text-gray-500">{item.quantity}x {item.unit_price ? `R$ ${item.unit_price.toLocaleString('pt-BR')}` : 'Valor Global'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <span className={`text-sm font-mono font-bold ${activeItems[item.id] ? 'text-white' : 'text-gray-600 line-through'}`}>
                                  R$ {Number(item.total_price).toLocaleString('pt-BR')}
                                </span>
                                <div className="flex items-center gap-2">
                                  {item.receipt_url ? (
                                    <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="p-2 text-[#d4a373] hover:bg-[#d4a373]/10 rounded-lg transition" title="Ver Comprovante">
                                      <FileText size={16} />
                                    </a>
                                  ) : (
                                    isEditable && activeItems[item.id] && (
                                      <button 
                                        onClick={() => { setSelectedCost(item); setIsReceiptModalOpen(true); }}
                                        className="p-2 text-gray-600 hover:text-white transition"
                                        title="Anexar Comprovante"
                                      >
                                        <Upload size={16} />
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : <div className="text-center py-12 text-gray-600"><Database size={48} className="mx-auto mb-4 opacity-20" /><p>Nenhum custo encontrado para este evento.</p></div>}
              </div>
            )}

            {/* --- MODO: GRÁFICOS --- */}
            {viewMode === 'charts' && (
              <div className="flex flex-col gap-8 h-full">
                <h3 className="font-serif text-2xl text-white italic mb-4">Distribuição do Orçamento Simulado: {activeTab}</h3>
                
                {chartData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[400px]">
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={5} dataKey="valor">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} stroke="#666" />
                          <YAxis dataKey="name" type="category" width={100} stroke="#666" tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                          <Bar dataKey="valor" fill="#d4a373" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-20">Ative itens no simulador para gerar os gráficos.</p>
                )}
              </div>
            )}

            {/* --- MODO: COMPARAÇÃO --- */}
            {viewMode === 'compare' && (
              <div className="flex flex-col gap-8 h-full">
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs text-gray-500 uppercase font-bold">Evento A</label>
                    <select value={compareEvent1} onChange={(e) => setCompareEvent1(e.target.value)} className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none">
                      {ABAS.map(aba => <option key={aba} value={aba}>{aba}</option>)}
                    </select>
                  </div>
                  <div className="text-[#d4a373] font-bold italic text-2xl">VS</div>
                  <div className="flex flex-col gap-2 w-1/3">
                    <label className="text-xs text-gray-500 uppercase font-bold">Evento B</label>
                    <select value={compareEvent2} onChange={(e) => setCompareEvent2(e.target.value)} className="bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none">
                      {ABAS.map(aba => <option key={aba} value={aba}>{aba}</option>)}
                    </select>
                  </div>
                </div>

                <div className="h-[400px] bg-black/20 rounded-xl p-6 border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData} margin={{ top: 20 }}>
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis tickFormatter={(value) => `R$${value/1000}k`} stroke="#888" />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                      <Bar dataKey="Total" fill="#b87333" radius={[8, 8, 0, 0]}>
                        {compareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#d4a373' : '#2a9d8f'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DE UPLOAD DE RECIBOS */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif italic text-white">Anexar Comprovante</h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Item selecionado</p>
              <p className="text-white font-bold">{selectedCost?.item_name}</p>
              <p className="text-[#d4a373] font-mono text-sm mt-1">R$ {selectedCost?.total_price.toLocaleString('pt-BR')}</p>
            </div>
            <form onSubmit={handleUploadReceipt} className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#d4a373]/50 transition-all group"
              >
                {receiptFile ? (
                  <div className="text-center">
                    <CheckCircle2 size={40} className="text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-white font-bold truncate max-w-[200px]">{receiptFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="text-gray-600 mb-4 group-hover:text-[#d4a373] transition-colors" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Clique para selecionar ficheiro</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
              </div>
              <button 
                type="submit" 
                disabled={!receiptFile}
                className="w-full py-4 bg-[#b87333] text-white font-bold rounded-xl shadow-lg hover:bg-[#d4a373] transition disabled:opacity-50"
              >
                Confirmar e Anexar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
