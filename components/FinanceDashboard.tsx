import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Transaction, ViewProps, EventCost } from '../types';
import { 
  TrendingUp, TrendingDown, Diamond, DollarSign, Users, 
  Calculator, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Info, Music, PartyPopper, Calendar, Ticket,
  Search, Scissors, AlertTriangle, CheckCircle2, List, ArrowRight, Settings2, Plus, Upload, FileText, X, ChevronDown, ChevronUp, Database
} from 'lucide-react';

interface FinanceDashboardProps extends ViewProps {}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ isEditable }) => {
  // Tabs
  const [activeTab, setActiveTab] = useState('general');
  const tabs = [
    { id: 'general', label: 'Geral' },
    { id: 'launch', label: 'Lançamento' },
    { id: 'pre_event_1', label: 'Pré-Evento 1' },
    { id: 'pre_event_2', label: 'Pré-Evento 2' },
    { id: 'prom', label: 'Baile' },
    { id: 'activations', label: 'Ativações' },
  ];

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<EventCost | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    file_url: ''
  });
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grouping State
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeEventName = (name: string): string => {
    if (!name) return 'general';
    const normalized = name.toUpperCase().trim();
    
    // Mapeia os nomes que vieram da planilha para os IDs das abas
    if (normalized.includes('PRÉ EVENTO 1')) return 'pre_event_1';
    if (normalized.includes('PRÉ EVENTO 2')) return 'pre_event_2';
    if (normalized.includes('LANÇAMENTO')) return 'launch';
    if (normalized.includes('BAILE')) return 'prom';
    if (normalized.includes('BENEFÍCIOS') || normalized.includes('MKT')) return 'activations';
    
    return 'general';
  };

  const fetchData = async () => {
    if (isSupabaseConfigured()) {
      // 1. Busca Transações Gerais
      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (transData) setTransactions(transData);

      // 2. Busca a nova tabela 'Orçamento' e converte para o formato do Frontend
      const { data: orcamentoData, error } = await supabase.from('Orçamento').select('*');
      
      if (error) {
        console.error("Erro ao ler tabela Orçamento:", error);
      } else if (orcamentoData) {
        const formatadoParaOFront = orcamentoData.map((item: any) => ({
          id: item.id,
          event_name: normalizeEventName(item.Evento),
          category: item.Categoria || 'Geral',
          item_name: item.Item,
          quantity: item.Qtd || 1,
          unit_price: item['Preço Unitário'] || 0,
          total_price: item['Preço Total'] || 0,
          receipt_url: item.nota_fiscal_url,
          status: item.nota_fiscal_url ? 'paid' : 'pending' // Se tem NF, considera pago
        }));
        
        setEventCosts(formatadoParaOFront);
      }
    }
  };

  const handleImportETL = async () => {
    // Como a tabela já foi preenchida diretamente via CSV no Supabase, 
    // este botão agora pode apenas forçar uma recarga dos dados.
    setIsImporting(true);
    try {
      await fetchData();
      alert('Dados do orçamento sincronizados com a base de dados!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Erro ao sincronizar dados.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCost || !receiptFile) return;

    try {
      let fileUrl = '';
      if (isSupabaseConfigured()) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `receipt_${selectedCost.id}_${Date.now()}.${fileExt}`;
        
        // Faz o upload para o bucket
        const { error: uploadError } = await supabase.storage.from('finance-receipts').upload(fileName, receiptFile);
        if (uploadError) throw uploadError;

        // Pega a URL pública
        const { data } = supabase.storage.from('finance-receipts').getPublicUrl(fileName);
        fileUrl = data.publicUrl;

        // Atualiza a tabela ORÇAMENTO (usando os nomes reais das colunas no banco)
        const { error: updateError } = await supabase
          .from('Orçamento')
          .update({ nota_fiscal_url: fileUrl })
          .eq('id', selectedCost.id);

        if (updateError) throw updateError;
        
        await fetchData(); // Recarrega os dados para mostrar o link na tela
      }
      setIsReceiptModalOpen(false);
      setSelectedCost(null);
      setReceiptFile(null);
    } catch (error) {
      console.error('Receipt upload error:', error);
      alert('Erro ao enviar comprovante. Verifique se o bucket "finance-receipts" existe.');
    }
  };

  // --- LÓGICAS DE EXIBIÇÃO ---
  const filteredCosts = useMemo(() => {
    return eventCosts.filter(c => c.event_name === activeTab);
  }, [eventCosts, activeTab]);

  const groupedCosts = useMemo(() => {
    const groups: Record<string, EventCost[]> = {};
    filteredCosts.forEach(cost => {
      if (!groups[cost.category]) groups[cost.category] = [];
      groups[cost.category].push(cost);
    });
    return groups;
  }, [filteredCosts]);

  const totals = useMemo(() => {
    const collected = transactions.filter(t => t.event_context === activeTab && t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const spent = transactions.filter(t => t.event_context === activeTab && t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    const budgetTotal = filteredCosts.reduce((acc, c) => acc + Number(c.total_price), 0);
    return { collected, spent, balance: collected - spent, budgetTotal };
  }, [transactions, filteredCosts, activeTab]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="h-full flex flex-col space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-3xl text-white italic tracking-tight">Gestão Financeira</h2>
          <div className="flex gap-3">
            {isEditable && (
              <button 
                onClick={handleImportETL}
                disabled={isImporting}
                className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
              >
                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                Sincronizar Banco
              </button>
            )}
            {isEditable && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-copper-gradient text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-copper-DEFAULT/20 transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(90deg, #b87333 0%, #d4a373 100%)' }} // Fallback de cor
              >
                <Plus size={18} /> Nova Transação
              </button>
            )}
          </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-black shadow-lg' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Orçamento Previsto</span>
           <h3 className="text-3xl font-serif font-bold text-white italic">
             R$ {totals.budgetTotal.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Entradas Reais</span>
           <h3 className="text-3xl font-serif font-bold italic text-[#d4a373]">
             R$ {totals.collected.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Saídas Reais</span>
           <h3 className="text-3xl font-serif font-bold text-white italic">
             R$ {totals.spent.toLocaleString('pt-BR')}
           </h3>
        </div>
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Saldo em Caixa</span>
           <h3 className={`text-3xl font-serif font-bold italic ${totals.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             R$ {totals.balance.toLocaleString('pt-BR')}
           </h3>
        </div>
      </div>

      {/* Event Costs (Grouped by Category) */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-serif text-2xl text-white italic flex items-center gap-3">
            <List size={24} className="text-[#d4a373]" />
            Detalhamento de Custos
          </h3>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Planilha da Agência</span>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedCosts).length > 0 ? (
            Object.entries(groupedCosts).map(([category, items]) => (
              <div key={category} className="border border-white/5 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4a373]"></div>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{category}</span>
                    <span className="text-[10px] text-gray-500">({items.length} itens)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-400">
                      Total: R$ {items.reduce((acc, i) => acc + Number(i.total_price), 0).toLocaleString('pt-BR')}
                    </span>
                    {expandedCategories[category] ? <ChevronUp size={16} className="text-white" /> : <ChevronDown size={16} className="text-white" />}
                  </div>
                </button>

                {expandedCategories[category] && (
                  <div className="p-4 space-y-2 bg-black/20">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition group">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-200">{item.item_name}</span>
                          <span className="text-[10px] text-gray-500">
                            {item.quantity}x {item.unit_price ? `R$ ${item.unit_price.toLocaleString('pt-BR')}` : 'Valor Global'}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-mono font-bold text-white">R$ {Number(item.total_price).toLocaleString('pt-BR')}</span>
                            <span className={`text-[9px] uppercase font-black tracking-widest ${item.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                              {item.status === 'paid' ? 'Comprovante OK' : 'Pendente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.receipt_url ? (
                              <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="p-2 text-[#d4a373] hover:bg-[#d4a373]/10 rounded-lg transition" title="Ver Comprovante">
                                <FileText size={16} />
                              </a>
                            ) : (
                              isEditable && (
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
          ) : (
            <div className="text-center py-12 text-gray-600">
              <Database size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Nenhum custo registado para esta aba.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Upload de Recibos */}
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

      {/* Modal de Nova Transação Simplificado (Mantido o seu original) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Nova Transação Manual</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Descrição</label>
                <input type="text" required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Valor (R$)</label>
                  <input type="number" required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Tipo</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-[#b87333] text-white rounded-lg font-bold text-sm hover:bg-[#d4a373] transition">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente simples de Loading caso não tenha o import
const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default FinanceDashboard;
