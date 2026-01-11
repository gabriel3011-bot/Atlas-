
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Diamond, DollarSign, Users, 
  Calculator, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';

const FinanceDashboard: React.FC = () => {
  // Simulator State
  const [graduates, setGraduates] = useState(120);
  const [ticketPrice, setTicketPrice] = useState(2500);
  const [fixedCosts, setFixedCosts] = useState(80000); // Venue, Band, etc.
  const [variableCostPerPerson, setVariableCostPerPerson] = useState(450); // Buffet, Drinks

  // Dashboard Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Simulation Logic
  const projectedRevenue = graduates * ticketPrice;
  const projectedVariableCosts = graduates * variableCostPerPerson;
  const totalProjectedExpenses = fixedCosts + projectedVariableCosts;
  const projectedNet = projectedRevenue - totalProjectedExpenses;
  const profitMargin = projectedRevenue > 0 ? (projectedNet / projectedRevenue) * 100 : 0;

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
    { name: 'Buffet', value: 65000 },
    { name: 'Local', value: 45000 },
    { name: 'Marketing', value: 12000 },
    { name: 'Atrações', value: 20000 },
    { name: 'Outros', value: 5000 },
  ];

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
    <div className="h-full flex flex-col space-y-10 pb-20 max-w-7xl mx-auto">
      
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-DEFAULT/30 transition-all duration-500 shadow-xl">
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

        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/20 transition-all duration-500 shadow-xl">
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

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-copper-light/30 transition-all duration-500 shadow-2xl bg-gradient-to-br from-city-black to-zinc-900/50">
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

      {/* 2. Charts Section */}
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
              Alocação de Verba
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
               <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Gasto Total</span>
               <span className="text-xl font-bold text-white">R$ 147k</span>
            </div>
        </div>
      </div>

      {/* 3. SCENARIO SIMULATOR (Urban Copper Style) */}
      <section className="relative mt-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-copper-dark/20 via-copper-light/10 to-transparent rounded-[2.5rem] blur-xl opacity-50"></div>
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                       <Calculator className="text-copper-light" size={24} />
                       <h2 className="font-serif text-3xl text-white italic tracking-tight">Simulador de Viabilidade Tática</h2>
                   </div>
                   <p className="text-gray-400 font-light max-w-xl">
                     Ajuste as variáveis para prever o impacto financeiro baseado na adesão da turma.
                   </p>
                </div>
                
                <div className={`px-10 py-6 rounded-2xl border flex flex-col items-center transition-all duration-700 ${projectedNet >= 0 ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_30px_rgba(74,222,128,0.05)]' : 'bg-red-500/5 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]'}`}>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Resultado Projetado</span>
                   <div className={`text-4xl font-serif font-black italic tracking-tighter tabular-nums ${projectedNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {projectedNet < 0 ? '-' : '+'} R$ {Math.abs(projectedNet).toLocaleString('pt-BR')}
                   </div>
                   <div className="mt-3 flex items-center gap-4 w-full">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-1000 ${projectedNet >= 0 ? 'bg-green-500 shadow-[0_0_10px_#4ade80]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} 
                           style={{ width: `${Math.min(Math.max(profitMargin + 50, 0), 100)}%` }}
                         />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{Math.round(profitMargin)}% Margem</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                
                {/* Formandos Slider */}
                <div className="col-span-1 lg:col-span-2 space-y-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                            <Users className="text-copper-DEFAULT" size={18} />
                            <label className="text-xs font-black text-gray-300 uppercase tracking-widest">Nº de Formandos (Adesão)</label>
                        </div>
                        <span className="text-3xl font-serif font-bold text-white italic">{graduates} <small className="text-xs uppercase text-gray-500 tracking-tighter">estudantes</small></span>
                    </div>
                    <div className="relative pt-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="250" 
                          value={graduates} 
                          onChange={(e) => setGraduates(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-copper-DEFAULT hover:accent-copper-light transition-all"
                        />
                        <div className="flex justify-between mt-3 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            <span>0</span>
                            <span>125</span>
                            <span>250 Máx</span>
                        </div>
                    </div>
                </div>

                {/* Numeric Inputs Grid */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Vlr. Adesão (Ticket)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold group-focus-within:text-copper-light transition-colors">R$</span>
                            <input 
                              type="number" 
                              value={ticketPrice} 
                              onChange={(e) => setTicketPrice(Number(e.target.value))}
                              className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-serif text-lg focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT outline-none transition shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Custo Fixo Total</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold group-focus-within:text-copper-light transition-colors">R$</span>
                            <input 
                              type="number" 
                              value={fixedCosts} 
                              onChange={(e) => setFixedCosts(Number(e.target.value))}
                              className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-serif text-lg focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT outline-none transition shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Custo Var. (Por Pessoa)</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold group-focus-within:text-copper-light transition-colors">R$</span>
                            <input 
                              type="number" 
                              value={variableCostPerPerson} 
                              onChange={(e) => setVariableCostPerPerson(Number(e.target.value))}
                              className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-white/10 rounded-xl text-white font-serif text-lg focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT outline-none transition shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Ponto de Equilíbrio</label>
                        <div className="w-full py-4 px-6 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-between">
                            <span className="text-gray-500 text-xs font-bold uppercase">Break-even</span>
                            <span className="text-white font-serif font-bold italic">
                              {Math.ceil(fixedCosts / (ticketPrice - variableCostPerPerson))} <small className="text-[10px] text-gray-500 font-sans uppercase">alunos</small>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-1">Receita Bruta</span>
                   <span className="text-xl font-serif text-white italic">R$ {projectedRevenue.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-1">Custo Fixo</span>
                   <span className="text-xl font-serif text-white italic">R$ {fixedCosts.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-1">Custo Variável Total</span>
                   <span className="text-xl font-serif text-white italic">R$ {projectedVariableCosts.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                   <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-1">Despesa Total</span>
                   <span className="text-xl font-serif text-white italic">R$ {totalProjectedExpenses.toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default FinanceDashboard;
