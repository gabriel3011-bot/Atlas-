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

  // --- ESTADOS DE CUSTOMIZAÇÃO DOS GRÁFICOS ---
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    'Adesões Integrais': true,
    'Adesões Bolsistas': true,
    'Convites Extras': true,
    'Mesas Extras': true,
    'Não Pagantes': true
  });
  const [costBuffer, setCostBuffer] = useState(0); // Margem de segurança global (%)
  const [companyFeePercent, setCompanyFeePercent] = useState(10); // Fee da empresa (%)
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // --- ESTADOS DO SIMULADOR DE RECEITA (LOTES) ---
  const [adesoesLotes, setAdesoesLotes] = useState([
    { name: 'Lote Comissão', qty: 13, price: 0 },
    { name: 'Lote Promocional', qty: 10, price: 8550 },
    { name: '1º Lote', qty: 37, price: 8950 },
    { name: '2º Lote', qty: 55, price: 9350 },
    { name: '3º Lote', qty: 45, price: 9750 },
    { name: '4º Lote', qty: 30, price: 10150 },
  ]);

  const [bolsistasLotes, setBolsistasLotes] = useState([
    { name: 'Lote Promocional', qty: 10, price: 4675 },
  ]);

  const [convitesLotes, setConvitesLotes] = useState([
    { name: 'Lote Promocional', qty: 35, price: 740 },
    { name: '1º Lote', qty: 105, price: 765 },
    { name: '2º Lote', qty: 175, price: 790 },
    { name: '3º Lote', qty: 175, price: 815 },
    { name: '4º Lote', qty: 210, price: 840 },
  ]);

  const [mesasLotes, setMesasLotes] = useState([
    { name: 'Lote Promocional', qty: 2, price: 9350 },
    { name: '1º Lote', qty: 9, price: 9600 },
    { name: '2º Lote', qty: 12, price: 9850 },
    { name: '3º Lote', qty: 12, price: 10100 },
    { name: '4º Lote', qty: 12, price: 10350 },
  ]);

  const [nonPayingGuestsQty, setNonPayingGuestsQty] = useState(20);

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
  const costsSimuladoRaw = costsForActiveTab.reduce((acc, c) => acc + (activeItems[c.id] ? Number(c.total_price) : 0), 0);
  const costsSimulado = costsSimuladoRaw * (1 + (costBuffer / 100));

  // Projeção de Receita (Baseada em Lotes)
  const revenueProjetada = useMemo(() => {
    const revAdesoesIntegrais = adesoesLotes.reduce((acc, l) => acc + (l.qty * l.price), 0);
    const revAdesoesBolsistas = bolsistasLotes.reduce((acc, l) => acc + (l.qty * l.price), 0);
    const revConvites = convitesLotes.reduce((acc, l) => acc + (l.qty * l.price), 0);
    const revMesas = mesasLotes.reduce((acc, l) => acc + (l.qty * l.price), 0);

    const revAdesoesTotal = revAdesoesIntegrais + revAdesoesBolsistas;

    const fullBreakdown = [
      { name: 'Adesões Integrais', valor: revAdesoesIntegrais },
      { name: 'Adesões Bolsistas', valor: revAdesoesBolsistas },
      { name: 'Convites Extras', valor: revConvites },
      { name: 'Mesas Extras', valor: revMesas }
    ];

    const filteredBreakdown = fullBreakdown.filter(item => visibleMetrics[item.name]);
    const totalVisivel = filteredBreakdown.reduce((acc, item) => acc + item.valor, 0);
    
    const companyFeeAmount = totalVisivel * (companyFeePercent / 100);

    const headcountFull = [
      { name: 'Formandos Integrais', qty: adesoesLotes.reduce((acc, l) => acc + l.qty, 0) * 10 },
      { name: 'Formandos Bolsistas', qty: bolsistasLotes.reduce((acc, l) => acc + l.qty, 0) * 10 },
      { name: 'Convites Extras', qty: convitesLotes.reduce((acc, l) => acc + l.qty, 0) },
      { name: 'Mesas Extras', qty: mesasLotes.reduce((acc, l) => acc + l.qty, 0) * 10 },
      { name: 'Não Pagantes', qty: nonPayingGuestsQty }
    ];

    const visibleHeadcount = headcountFull.filter(h => {
      if (h.name === 'Formandos Integrais') return visibleMetrics['Adesões Integrais'];
      if (h.name === 'Formandos Bolsistas') return visibleMetrics['Adesões Bolsistas'];
      if (h.name === 'Convites Extras') return visibleMetrics['Convites Extras'];
      if (h.name === 'Mesas Extras') return visibleMetrics['Mesas Extras'];
      if (h.name === 'Não Pagantes') return visibleMetrics['Não Pagantes'];
      return true;
    });

    return {
      total: totalVisivel,
      subtotals: {
        adesoes: revAdesoesTotal,
        convites: revConvites,
        mesas: revMesas
      },
      fee: companyFeeAmount,
      breakdown: filteredBreakdown,
      headcountData: visibleHeadcount,
      headcount: {
        formandos: adesoesLotes.reduce((acc, l) => acc + l.qty, 0) + bolsistasLotes.reduce((acc, l) => acc + l.qty, 0),
        convitesExtras: convitesLotes.reduce((acc, l) => acc + l.qty, 0),
        mesasExtras: mesasLotes.reduce((acc, l) => acc + l.qty, 0),
        staff: nonPayingGuestsQty
      }
    };
  }, [adesoesLotes, bolsistasLotes, convitesLotes, mesasLotes, nonPayingGuestsQty, visibleMetrics, companyFeePercent]);

  const totalHeadcount = revenueProjetada.headcountData.reduce((acc, h) => acc + h.qty, 0);

  const netProjected = revenueProjetada.total - costsSimulado - revenueProjetada.fee;

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

  const costImpactData = useMemo(() => {
    const totalRev = revenueProjetada.total || 1;
    return chartData.map(d => ({
      ...d,
      percentual: Number(((d.valor / totalRev) * 100).toFixed(1))
    }));
  }, [chartData, revenueProjetada.total]);

  const revenueVsCostsData = useMemo(() => [
    { name: 'Receita Projetada', valor: revenueProjetada.total, fill: '#2a9d8f' },
    { name: 'Custos Simulados', valor: costsSimulado, fill: '#e76f51' }
  ], [revenueProjetada.total, costsSimulado]);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Receita Projetada</span>
           <h3 className="text-2xl font-mono font-bold text-[#2a9d8f]">
             R$ {revenueProjetada.total.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Custos Simulados</span>
           <h3 className="text-2xl font-mono font-bold text-[#e76f51]">
             R$ {costsSimulado.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Fee da Empresa ({companyFeePercent}%)</span>
           <h3 className="text-2xl font-mono font-bold text-amber-500">
             - R$ {revenueProjetada.fee.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className={`bg-[#121212] border rounded-2xl p-6 shadow-xl transition-colors ${netProjected >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
           <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${netProjected >= 0 ? 'text-green-500' : 'text-red-500'}`}>
             Resultado Estimado
           </span>
           <h3 className={`text-2xl font-mono font-bold flex flex-col ${netProjected >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             R$ {netProjected.toLocaleString('pt-BR')}
             <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full font-sans not-italic text-gray-400 w-fit mt-1">
               Margem: {revenueProjetada.total > 0 ? ((netProjected / revenueProjetada.total) * 100).toFixed(1) : 0}%
             </span>
           </h3>
        </div>
      </div>

      {/* BREAKDOWN DE RECEITA RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-gray-500">Total Adesões</span>
          <span className="text-sm font-bold text-white font-mono">R$ {revenueProjetada.subtotals.adesoes.toLocaleString('pt-BR')}</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-gray-500">Total Convites</span>
          <span className="text-sm font-bold text-white font-mono">R$ {revenueProjetada.subtotals.convites.toLocaleString('pt-BR')}</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-gray-500">Total Mesas</span>
          <span className="text-sm font-bold text-white font-mono">R$ {revenueProjetada.subtotals.mesas.toLocaleString('pt-BR')}</span>
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
              <div className="space-y-10">
                {/* SIMULADOR DE RECEITA */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Calculator className="text-[#d4a373]" size={24} />
                    <h3 className="font-serif text-xl text-white italic">Simulador de Receita (Adesões & Extras)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ADESÕES INTEGRAIS */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Adesões Integrais</h4>
                      <div className="space-y-3">
                        {adesoesLotes.map((lote, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-[10px] text-gray-400 font-bold">{lote.name}</span>
                            <input 
                              type="number" 
                              value={lote.qty} 
                              onChange={e => {
                                const newLotes = [...adesoesLotes];
                                newLotes[idx].qty = Number(e.target.value);
                                setAdesoesLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Qtd"
                            />
                            <input 
                              type="number" 
                              value={lote.price} 
                              onChange={e => {
                                const newLotes = [...adesoesLotes];
                                newLotes[idx].price = Number(e.target.value);
                                setAdesoesLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Valor"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CONVITES EXTRAS */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Convites Extras</h4>
                      <div className="space-y-3">
                        {convitesLotes.map((lote, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-[10px] text-gray-400 font-bold">{lote.name}</span>
                            <input 
                              type="number" 
                              value={lote.qty} 
                              onChange={e => {
                                const newLotes = [...convitesLotes];
                                newLotes[idx].qty = Number(e.target.value);
                                setConvitesLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Qtd"
                            />
                            <input 
                              type="number" 
                              value={lote.price} 
                              onChange={e => {
                                const newLotes = [...convitesLotes];
                                newLotes[idx].price = Number(e.target.value);
                                setConvitesLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Valor"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MESAS EXTRAS */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Mesas Extras</h4>
                      <div className="space-y-3">
                        {mesasLotes.map((lote, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-[10px] text-gray-400 font-bold">{lote.name}</span>
                            <input 
                              type="number" 
                              value={lote.qty} 
                              onChange={e => {
                                const newLotes = [...mesasLotes];
                                newLotes[idx].qty = Number(e.target.value);
                                setMesasLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Qtd"
                            />
                            <input 
                              type="number" 
                              value={lote.price} 
                              onChange={e => {
                                const newLotes = [...mesasLotes];
                                newLotes[idx].price = Number(e.target.value);
                                setMesasLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Valor"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BOLSISTAS & STAFF */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Bolsistas & Staff</h4>
                      <div className="space-y-3">
                        {bolsistasLotes.map((lote, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-[10px] text-gray-400 font-bold">Bolsista {lote.name}</span>
                            <input 
                              type="number" 
                              value={lote.qty} 
                              onChange={e => {
                                const newLotes = [...bolsistasLotes];
                                newLotes[idx].qty = Number(e.target.value);
                                setBolsistasLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Qtd"
                            />
                            <input 
                              type="number" 
                              value={lote.price} 
                              onChange={e => {
                                const newLotes = [...bolsistasLotes];
                                newLotes[idx].price = Number(e.target.value);
                                setBolsistasLotes(newLotes);
                              }}
                              className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373]"
                              placeholder="Valor"
                            />
                          </div>
                        ))}
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <span className="text-[10px] text-gray-400 font-bold">Staff/Cortesias</span>
                          <input 
                            type="number" 
                            value={nonPayingGuestsQty} 
                            onChange={e => setNonPayingGuestsQty(Number(e.target.value))}
                            className="bg-black/50 border border-white/10 rounded p-2 text-xs text-white font-mono outline-none focus:border-[#d4a373] col-span-2"
                          />
                        </div>
                        <div className="bg-[#d4a373]/10 border border-[#d4a373]/20 rounded-lg p-3 mt-4">
                          <span className="text-[10px] font-black text-[#d4a373] uppercase block">Headcount Total</span>
                          <span className="text-white font-bold font-mono">{totalHeadcount} pessoas</span>
                        </div>
                      </div>
                    </div>

                    {/* GESTÃO DE FEE DA EMPRESA */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Gestão de Fee da Empresa</h4>
                      <div className="space-y-4 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <span className="text-[10px] text-amber-500 font-bold uppercase">Fee (%)</span>
                          <input 
                            type="number" 
                            value={companyFeePercent} 
                            onChange={e => setCompanyFeePercent(Number(e.target.value))}
                            className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-xs text-amber-500 font-mono outline-none focus:border-amber-500 col-span-2"
                          />
                        </div>
                        <div className="space-y-2 border-t border-amber-500/10 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 uppercase">Faturamento Base</span>
                            <span className="text-xs font-bold text-white font-mono">R$ {revenueProjetada.total.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-amber-500 uppercase font-bold">Fee Calculado</span>
                            <span className="text-xs font-bold text-amber-500 font-mono">R$ {revenueProjetada.fee.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-600 italic leading-tight">
                          O fee é calculado sobre o faturamento visível (após filtros de métricas).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl text-white italic">Ativar/Desativar itens de custo para simulação</h3>
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
                                    <span className="text-[10px] text-gray-500 font-mono">{item.quantity}x {item.unit_price ? `R$ ${item.unit_price.toLocaleString('pt-BR')}` : 'Valor Global'}</span>
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
              </div>
            )}

            {/* --- MODO: GRÁFICOS --- */}
            {viewMode === 'charts' && (
              <div className="flex flex-col gap-12 h-full">
                {/* CONTROLES DE CUSTOMIZAÇÃO DOS GRÁFICOS */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    {/* FILTRO DE MÉTRICAS */}
                    <div className="space-y-4 flex-1">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Personalizar Métricas nos Gráficos</h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.keys(visibleMetrics).map(metric => (
                          <button
                            key={metric}
                            onClick={() => setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }))}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              visibleMetrics[metric] 
                                ? 'bg-[#2a9d8f]/20 border-[#2a9d8f] text-[#2a9d8f]' 
                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                            }`}
                          >
                            {metric}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* MARGEM DE SEGURANÇA (BUFFER) */}
                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Margem de Segurança (Custos)</h4>
                        <span className="text-xs font-mono text-[#e76f51] font-bold">+{costBuffer}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="5" 
                        value={costBuffer} 
                        onChange={(e) => setCostBuffer(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#e76f51]"
                      />
                      <p className="text-[9px] text-gray-600 italic">Adiciona um percentual de segurança sobre todos os custos simulados.</p>
                    </div>

                    {/* TIPO DE GRÁFICO */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Tipo de Visualização</h4>
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setChartType('pie')}
                          className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${chartType === 'pie' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          <PieIcon size={14} /> Pizza
                        </button>
                        <button 
                          onClick={() => setChartType('bar')}
                          className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${chartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          <BarChart3 size={14} /> Barras
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* GRÁFICO 1: RECEITA VS CUSTOS */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Receita Projetada vs Custos Simulados</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueVsCostsData}>
                          <XAxis dataKey="name" stroke="#666" fontSize={12} />
                          <YAxis tickFormatter={(value) => `R$${value/1000}k`} stroke="#666" fontSize={12} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                          <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* GRÁFICO 2: COMPOSIÇÃO DA RECEITA */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Composição da Receita</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                          <PieChart>
                            <Pie data={revenueProjetada.breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valor">
                              {revenueProjetada.breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Legend />
                          </PieChart>
                        ) : (
                          <BarChart data={revenueProjetada.breakdown}>
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis tickFormatter={(value) => `R$${value/1000}k`} stroke="#666" fontSize={12} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Bar dataKey="valor">
                              {revenueProjetada.breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* GRÁFICO 3: DISTRIBUIÇÃO DE CUSTOS POR CATEGORIA */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Distribuição de Custos por Categoria</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valor">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[(index + 3) % CORES_GRAFICO.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Legend />
                          </PieChart>
                        ) : (
                          <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis tickFormatter={(value) => `R$${value/1000}k`} stroke="#666" fontSize={12} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Bar dataKey="valor">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[(index + 3) % CORES_GRAFICO.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* GRÁFICO 4: RANKING DE CUSTOS */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Ranking de Custos (Maiores Categorias)</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} stroke="#666" />
                          <YAxis dataKey="name" type="category" width={100} stroke="#666" tick={{fontSize: 10}} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                          <Bar dataKey="valor" fill="#d4a373" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* GRÁFICO 5: DISTRIBUIÇÃO DE PÚBLICO (HEADCOUNT) */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Distribuição de Público (Headcount)</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                          <PieChart>
                            <Pie data={revenueProjetada.headcountData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="qty">
                              {revenueProjetada.headcountData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[(index + 5) % CORES_GRAFICO.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} pessoas`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Legend />
                          </PieChart>
                        ) : (
                          <BarChart data={revenueProjetada.headcountData}>
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={12} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => `${value} pessoas`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Bar dataKey="qty">
                              {revenueProjetada.headcountData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_GRAFICO[(index + 5) % CORES_GRAFICO.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* GRÁFICO 6: IMPACTO DOS CUSTOS NA RECEITA (%) */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Impacto dos Custos na Receita (%)</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={costImpactData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#666" />
                          <YAxis dataKey="name" type="category" width={100} stroke="#666" tick={{fontSize: 10}} />
                          <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                            formatter={(value, name, props) => [`${value}% (R$ ${props.payload.valor.toLocaleString('pt-BR')})`, 'Impacto']}
                            contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} 
                          />
                          <Bar dataKey="percentual" fill="#e76f51" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
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