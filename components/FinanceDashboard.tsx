
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Transaction, ViewProps } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Diamond, DollarSign, Users, 
  Calculator, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Info, Music, PartyPopper, Calendar, Ticket,
  Search, Scissors, AlertTriangle, CheckCircle2, List, ArrowRight, Settings2
} from 'lucide-react';

interface FinanceDashboardProps extends ViewProps {}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ isEditable }) => {
  // Simulator State
  const [graduates, setGraduates] = useState(120);
  const [ticketPrice, setTicketPrice] = useState(4500); // Ticket médio ajustado para o cenário
  
  // Convites Extras
  const [extraInvitesQty, setExtraInvitesQty] = useState(0);
  const [extraInvitePrice, setExtraInvitePrice] = useState(350);

  // Novos Inputs de Custo
  const [attractionBudget, setAttractionBudget] = useState(150000); // Verba Atração
  const [preEventsCost, setPreEventsCost] = useState(40000); // 2 Pré-eventos
  const [launchCost, setLaunchCost] = useState(25000); // Lançamento
  const [afterCost, setAfterCost] = useState(15000); // After

  // Dashboard Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Simulation Logic
  const PEOPLE_PER_GRADUATE = 10; // 1 Formando + 9 Convidados
  
  // Público Total = (Formandos * 10) + Convites Extras
  const totalHeadcount = (graduates * PEOPLE_PER_GRADUATE) + extraInvitesQty;

  const graduatesRevenue = graduates * ticketPrice;
  const extraRevenue = extraInvitesQty * extraInvitePrice;
  const projectedRevenue = graduatesRevenue + extraRevenue;
  
  // Soma dos custos específicos (substituindo fixo/variável antigo)
  const totalProjectedExpenses = attractionBudget + preEventsCost + launchCost + afterCost;
  
  const projectedNet = projectedRevenue - totalProjectedExpenses;
  const profitMargin = projectedRevenue > 0 ? (projectedNet / projectedRevenue) * 100 : 0;
  
  // Break-even: Quantos formandos preciso para cobrir a soma dos eventos (sem contar extras, para segurança)
  const breakEvenGraduates = Math.ceil(totalProjectedExpenses / ticketPrice);

  useEffect(() => {
    // Mock Real transactions for the dashboard
    setTransactions([
      { id: 1, amount: 250000, type: 'income', category: 'Adesões', date: '2023-11-01', description: 'Lote 1' },
      { id: 2, amount: 45000, type: 'expense', category: 'Local', date: '2023-11-05', description: 'Reserva Salão' },
      { id: 3, amount: 12000, type: 'expense', category: 'Marketing', date: '2023-11-10', description: 'Social Media' },
      { id: 4, amount: 80000, type: 'income', category: 'Patrocínio', date: '2023-11-15', description: 'Banco Master' },
      { id: 5, amount: 65000, type: 'expense', category: 'Buffet', date: '2023-11-20', description: 'Entrada Buffet' },
      { id: 6, amount: 20000, type: 'expense', category: 'Atrações', date: '2023-11-25', description: 'Sinal Banda' },
    ]);
  }, []);

  const totals = useMemo(() => {
    const collected = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const spent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { collected, spent, balance: collected - spent };
  }, [transactions]);

  // Chart Data
  const expenseBreakdown = [
    { name: 'Atrações', value: attractionBudget },
    { name: 'Pré-Eventos', value: preEventsCost },
    { name: 'Lançamento', value: launchCost },
    { name: 'After', value: afterCost },
    { name: 'Outros', value: 5000 }, // Valor simbólico para o gráfico não quebrar
  ];

  // Logic for Consultant Analysis
  const costRanking = [
      { name: 'Atrações/Show', value: attractionBudget, color: '#C5836A' },
      { name: 'Pré-Eventos', value: preEventsCost, color: '#dfa67b' },
      { name: 'Lançamento', value: launchCost, color: '#8C5243' },
      { name: 'After Party', value: afterCost, color: '#EBC0A0' },
  ].sort((a, b) => b.value - a.value);

  const cashFlow = [
    { month: 'Jun', income: 45000, expense: 20000 },
    { month: 'Jul', income: 52000, expense: 35000 },
    { month: 'Ago', income: 48000, expense: 41000 },
    { month: 'Set', income: 75000, expense: 30000 },
    { month: 'Out', income: 90000, expense: 65000 },
    { month: 'Nov', income: 120000, expense: 80000 },
  ];

  const COLORS = ['#C5836A', '#dfa67b', '#8C5243', '#EBC0A0', '#444'];

  return (
    <div className="h-full flex flex-col space-y-10 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* 1. KPI Cards (Actuals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all duration-500 shadow-xl">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-copper-DEFAULT/10 rounded-lg text-copper-light">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Arrecadado</span>
           </div>
           <h3 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-copper-gradient italic">
             R$ {totals.collected.toLocaleString('pt-BR')}
           </h3>
           <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-medium">
             <ArrowUpRight size={14} /> 12% vs mês anterior
           </div>
        </div>

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all duration-500 shadow-xl">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                <TrendingDown size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Investido</span>
           </div>
           <h3 className="text-4xl font-serif font-bold text-white italic">
             R$ {totals.spent.toLocaleString('pt-BR')}
           </h3>
           <div className="mt-4 flex items-center gap-2 text-xs text-red-400 font-medium">
             <ArrowDownRight size={14} /> 5 contratos pendentes
           </div>
        </div>

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all duration-500 shadow-2xl bg-gradient-to-br from-city-black to-zinc-900/50">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-lg text-white">
                <Diamond size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saldo Disponível</span>
           </div>
           <h3 className={`text-4xl font-serif font-bold italic ${totals.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             R$ {totals.balance.toLocaleString('pt-BR')}
           </h3>
           <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-medium">
             <Info size={14} /> Capital de giro garantido
           </div>
           <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-copper-DEFAULT/5 blur-3xl rounded-full"></div>
        </div>
      </div>

      {/* 2. SCENARIO SIMULATOR (Prominent Top Card) */}
      <section className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-copper-dark via-copper-DEFAULT to-copper-dark rounded-[2.5rem] blur opacity-20"></div>
        <div className="relative bg-[#080808] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden">
            
            {/* Simulator Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8 border-b border-white/5 pb-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-copper-dark to-black rounded-2xl border border-white/10 shadow-lg">
                       <Calculator className="text-white" size={28} />
                    </div>
                    <div>
                        <h2 className="font-serif text-3xl text-white italic tracking-tight mb-1">Simulador Tático</h2>
                        <p className="text-gray-400 font-light text-sm max-w-md">
                          Projeção financeira baseada em adesões e custos estimados.
                          <span className="text-copper-light block mt-1 font-bold text-xs uppercase tracking-wider">Metodologia: 1 Formando = 10 Pessoas</span>
                        </p>
                    </div>
                </div>

                {/* Big Result Display */}
                <div className={`flex flex-col items-center justify-center px-12 py-4 rounded-2xl border bg-[#121212] transition-all duration-500 ${projectedNet >= 0 ? 'border-green-500/30 shadow-[0_0_40px_-10px_rgba(34,197,94,0.1)]' : 'border-red-500/30 shadow-[0_0_40px_-10px_rgba(239,68,68,0.1)]'}`}>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Resultado Projetado</span>
                   <div className={`text-5xl font-serif font-black italic tracking-tighter tabular-nums drop-shadow-lg ${projectedNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {projectedNet < 0 ? '-' : '+'} R$ {Math.abs(projectedNet).toLocaleString('pt-BR')}
                   </div>
                   <div className="mt-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${projectedNet >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-bold text-gray-400">{Math.round(profitMargin)}% Margem Estimada</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Column: Revenue Drivers */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={16} className="text-copper-DEFAULT" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Configuração de Receita</h3>
                    </div>

                    {/* Slider */}
                    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 group hover:border-copper-DEFAULT/20 transition-colors">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nº de Formandos (Adesão)</label>
                                <span className="text-[10px] text-gray-600 mt-1 block">Público Estimado: <strong className="text-white">{totalHeadcount}</strong> pessoas</span>
                            </div>
                            <span className="text-3xl font-serif font-bold text-white italic">{graduates} <small className="text-xs uppercase text-gray-500 tracking-tighter font-sans">alunos</small></span>
                        </div>
                        <input 
                          disabled={!isEditable}
                          type="range" 
                          min="0" 
                          max="250" 
                          value={graduates} 
                          onChange={(e) => setGraduates(Number(e.target.value))}
                          className={`w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${isEditable ? 'accent-copper-DEFAULT hover:accent-copper-light' : 'accent-gray-600'} transition-all`}
                        />
                         <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-700 uppercase tracking-widest">
                            <span>0</span>
                            <span>Meta: 120</span>
                            <span>Máx: 250</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vlr. Adesão (Ticket)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-copper-light transition-colors">R$</span>
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={ticketPrice} 
                                onChange={(e) => setTicketPrice(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-bold text-lg focus:border-copper-DEFAULT outline-none transition shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qtd. Convites Extras</label>
                            <div className="relative group">
                                <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-copper-light transition-colors" />
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={extraInvitesQty} 
                                onChange={(e) => setExtraInvitesQty(Math.max(0, Number(e.target.value)))}
                                className="w-full pl-10 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-bold text-lg focus:border-copper-DEFAULT outline-none transition shadow-inner"
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Unit. Extra</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-copper-light transition-colors">R$</span>
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={extraInvitePrice} 
                                onChange={(e) => setExtraInvitePrice(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-bold text-lg focus:border-copper-DEFAULT outline-none transition shadow-inner"
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ponto de Equilíbrio</label>
                             <div className="w-full h-[60px] px-4 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-between">
                                <span className="text-gray-500 text-xs font-bold uppercase">Break-even</span>
                                <span className="text-white font-serif font-bold italic text-lg">
                                {breakEvenGraduates} <small className="text-[10px] text-gray-500 font-sans uppercase">alunos</small>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Expense Drivers */}
                <div className="lg:col-span-5 space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings2 size={16} className="text-copper-DEFAULT" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Estrutura de Custos</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <span>Verba Atrações</span>
                                <span className="text-copper-light">Principal</span>
                            </label>
                            <div className="relative group">
                                <Music size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-copper-dark group-focus-within:text-copper-light transition-colors" />
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={attractionBudget} 
                                onChange={(e) => setAttractionBudget(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-copper-DEFAULT/30 rounded-xl text-white font-medium focus:border-copper-DEFAULT outline-none transition shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pré-Eventos (Total)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold group-focus-within:text-white transition-colors">R$</span>
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={preEventsCost} 
                                onChange={(e) => setPreEventsCost(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-white font-medium focus:border-white/30 outline-none transition shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Festa de Lançamento</label>
                            <div className="relative group">
                                <PartyPopper size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" />
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={launchCost} 
                                onChange={(e) => setLaunchCost(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-white font-medium focus:border-white/30 outline-none transition shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">After Party</label>
                            <div className="relative group">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-white transition-colors" />
                                <input 
                                disabled={!isEditable}
                                type="number" 
                                value={afterCost} 
                                onChange={(e) => setAfterCost(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-white font-medium focus:border-white/30 outline-none transition shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
                 <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Receita Total: <span className="text-white">R$ {projectedRevenue.toLocaleString('pt-BR')}</span></span>
                 </div>
                 <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-copper-DEFAULT rounded-full"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Despesa Total: <span className="text-white">R$ {totalProjectedExpenses.toLocaleString('pt-BR')}</span></span>
                 </div>
                 {extraRevenue > 0 && (
                    <div className="flex gap-2 items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Receita Extra: <span className="text-green-400">R$ {extraRevenue.toLocaleString('pt-BR')}</span></span>
                    </div>
                 )}
            </div>
        </div>
      </section>

      {/* 3. Charts Section (Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-3 bg-[#121212] rounded-2xl border border-white/5 p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-xl text-white italic flex items-center gap-3">
                  <TrendingUp size={18} className="text-copper-light" />
                  Fluxo de Caixa (6 Meses)
                </h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlow}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis 
                          dataKey="month" 
                          tick={{fill: '#71717a', fontSize: 11, fontWeight: 'bold'}} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          tick={{fill: '#71717a', fontSize: 11}} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(val) => `R$${val/1000}k`} 
                        />
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                          contentStyle={{backgroundColor: '#050505', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'}}
                          itemStyle={{fontSize: '12px'}}
                        />
                        <Bar dataKey="income" name="Entradas" fill="url(#copperGrad)" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="expense" name="Saídas" fill="#444" radius={[4, 4, 0, 0]} barSize={20} />
                        <defs>
                          <linearGradient id="copperGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dfa67b" />
                            <stop offset="100%" stopColor="#ac6356" />
                          </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="lg:col-span-2 bg-[#121212] rounded-2xl border border-white/5 p-8 shadow-xl relative overflow-hidden">
            <h3 className="font-serif text-xl text-white italic mb-8 flex items-center gap-3">
              <PieIcon size={18} className="text-copper-light" />
              Simulação de Custos
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{backgroundColor: '#050505', borderRadius: '12px', border: '1px solid #333'}}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', color: '#71717a', paddingTop: '20px'}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Center Label */}
            <div className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
               <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Investimento</span>
               <span className="text-lg font-bold text-white">R$ {totalProjectedExpenses.toLocaleString('pt-BR', { notation: "compact" })}</span>
            </div>
        </div>
      </div>

      {/* 4. CONSULTANT ANALYSIS SECTION */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-3 bg-white/5 rounded-2xl">
              <Search className="text-copper-light" size={24} />
           </div>
           <div>
              <h2 className="font-serif text-2xl text-white italic">Raio-X das Despesas (Consultoria)</h2>
              <p className="text-gray-500 text-sm font-light">Análise detalhada do fluxo de caixa e oportunidades.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Geral */}
            <div className="lg:col-span-3 bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Grande Total (Status Geral)</span>
                    <div className="flex items-end gap-2">
                        <span className={`text-5xl font-serif font-black italic tracking-tighter ${projectedNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {projectedNet >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                        </span>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${projectedNet >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                           {projectedNet >= 0 ? 'Caixa Positivo' : 'Atenção Necessária'}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl">
                        O custo total estimado da festa é de <strong className="text-white">R$ {totalProjectedExpenses.toLocaleString('pt-BR')}</strong>. 
                        Com a receita projetada de <strong className="text-white">R$ {projectedRevenue.toLocaleString('pt-BR')}</strong> (considerando {graduates} formandos), 
                        o caixa atual {projectedNet >= 0 ? 'cobre todas as despesas e gera uma reserva.' : 'não é suficiente para cobrir os custos planejados.'}
                    </p>
                </div>
                <div className="w-full md:w-auto min-w-[250px] p-6 bg-white/5 rounded-xl border border-white/5 text-center">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Saldo Final Projetado</span>
                    <div className={`text-3xl font-serif font-bold italic mt-2 ${projectedNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {projectedNet < 0 ? '-' : '+'} R$ {Math.abs(projectedNet).toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>

            {/* Ranking de Gastos */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-white italic">Ranking de Custos</h3>
                  <List size={16} className="text-gray-600" />
               </div>
               <div className="space-y-4">
                  {costRanking.map((item, idx) => {
                      const percent = Math.round((item.value / totalProjectedExpenses) * 100) || 0;
                      return (
                          <div key={item.name} className="group">
                              <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">{idx + 1}.</span>
                                      <span className="text-sm text-gray-300 font-medium group-hover:text-white transition">{item.name}</span>
                                  </div>
                                  <span className="text-xs font-bold text-gray-400">{percent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-1000" 
                                    style={{ width: `${percent}%`, backgroundColor: item.color }}
                                  ></div>
                              </div>
                              <div className="text-right mt-1">
                                  <span className="text-[10px] text-gray-600">R$ {item.value.toLocaleString('pt-BR')}</span>
                              </div>
                          </div>
                      )
                  })}
               </div>
            </div>

            {/* Zoom em Pré-Eventos */}
            <div className="lg:col-span-2 bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-copper-DEFAULT/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-copper-DEFAULT/10 rounded-lg text-copper-light">
                          <Search size={18} />
                      </div>
                      <h3 className="font-serif text-lg text-white italic">Raio-X: Pré-Eventos (R$ {preEventsCost.toLocaleString('pt-BR')})</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Eventos Realizados</h4>
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-copper-light"></div>
                                <span className="text-sm text-gray-300">Churrasco 500 Dias</span>
                             </div>
                             <span className="text-sm font-bold text-white">~R$ {(preEventsCost * 0.4).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-copper-dark"></div>
                                <span className="text-sm text-gray-300">Cervejada Meio Médico</span>
                             </div>
                             <span className="text-sm font-bold text-white">~R$ {(preEventsCost * 0.6).toLocaleString('pt-BR')}</span>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Maiores Ofensores de Custo</h4>
                          <div className="space-y-3">
                             <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                   <span>Open Bar (Bebidas)</span>
                                   <span className="text-red-400 font-bold">Alto Impacto</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full"><div className="w-[80%] h-full bg-red-500/50 rounded-full"></div></div>
                             </div>
                             <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                   <span>Locação de Espaço</span>
                                   <span className="text-yellow-500 font-bold">Médio Impacto</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full"><div className="w-[50%] h-full bg-yellow-500/50 rounded-full"></div></div>
                             </div>
                             <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                   <span>Som & Iluminação</span>
                                   <span className="text-green-500 font-bold">Baixo Impacto</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full"><div className="w-[30%] h-full bg-green-500/50 rounded-full"></div></div>
                             </div>
                          </div>
                      </div>
                   </div>
                </div>
            </div>
            
            {/* Plano de Redução */}
            <div className="lg:col-span-3">
                <h3 className="font-serif text-lg text-white italic mb-6 flex items-center gap-2">
                    <Scissors size={18} className="text-copper-light" />
                    Plano de Redução de Custos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg group-hover:bg-green-500/20 transition">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Opção 1</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Renegociar Open Bar</h4>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            Substituir marcas premium por intermediárias nos pré-eventos restantes pode gerar uma economia de até <strong className="text-green-400">15%</strong> na categoria.
                        </p>
                    </div>

                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg group-hover:bg-yellow-500/20 transition">
                                <AlertTriangle size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Opção 2</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Convites Digitais</h4>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            Eliminar convites físicos e brindes de papelaria para os pré-eventos. Foco 100% digital reduz custo operacional em <strong className="text-yellow-400">5%</strong>.
                        </p>
                    </div>

                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 hover:border-copper-DEFAULT/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-copper-DEFAULT/10 text-copper-light rounded-lg group-hover:bg-copper-DEFAULT/20 transition">
                                <ArrowRight size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Opção 3</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Local do After Party</h4>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            Mover o After Party para um espaço da universidade ou local parceiro com isenção de aluguel. Economia projetada de <strong className="text-copper-light">30%</strong> neste item.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
