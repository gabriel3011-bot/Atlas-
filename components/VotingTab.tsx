
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Poll, ViewProps } from '../types';
import { Clock, CheckCircle2, BarChart2, Plus, X, Trash2 } from 'lucide-react';

interface VotingTabProps extends ViewProps {}

const VotingTab: React.FC<VotingTabProps> = ({ isEditable }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selections, setSelections] = useState<Record<number, string>>({});

  // Form State
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    deadline: '',
    options: ['', ''] // Start with 2 empty options
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('polls').select('*');
      if (data) setPolls(data);
    } else {
      setPolls([]);
    }
  };

  const handleVote = async (pollId: number) => {
    const selectedOption = selections[pollId];
    if (!selectedOption) return;

    // Optimistic Update
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newResults = { ...poll.results };
        newResults[selectedOption] = (newResults[selectedOption] || 0) + 1;
        return {
          ...poll,
          user_voted_option: selectedOption,
          results: newResults,
          total_votes: (poll.total_votes || 0) + 1
        };
      }
      return poll;
    }));

    if (isSupabaseConfigured()) {
       await supabase.from('votes').insert([{ poll_id: pollId, option_selected: selectedOption }]);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    const cleanOptions = newPoll.options.filter(opt => opt.trim() !== '');
    
    if (cleanOptions.length < 2) {
      alert("A enquete precisa de pelo menos 2 opções.");
      return;
    }

    const pollData: Poll = {
      id: Date.now(),
      title: newPoll.title,
      description: newPoll.description,
      deadline: newPoll.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 week
      options: cleanOptions,
      total_votes: 0,
      results: cleanOptions.reduce((acc, curr) => ({...acc, [curr]: 0}), {})
    };

    setPolls([pollData, ...polls]);

    if (isSupabaseConfigured()) {
      await supabase.from('polls').insert([{
        title: pollData.title,
        description: pollData.description,
        deadline: pollData.deadline,
        options: pollData.options
      }]);
    }

    setIsModalOpen(false);
    setNewPoll({ title: '', description: '', deadline: '', options: ['', ''] });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const removeOption = (index: number) => {
    const newOptions = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="h-full max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h2 className="font-serif text-4xl text-white mb-2">Votações & Enquetes</h2>
           <p className="text-gray-400 font-light">Participe das decisões importantes da turma.</p>
        </div>
        {isEditable && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-copper-gradient text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            <Plus size={20} /> Nova Votação
          </button>
        )}
      </div>

      <div className="space-y-8 pb-10">
        {polls.map((poll) => {
            const hasVoted = !!poll.user_voted_option;
            const daysLeft = Math.ceil((new Date(poll.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft <= 0;
            
            return (
                <div key={poll.id} className="bg-[#121212] rounded-2xl border border-white/10 p-8 shadow-xl relative overflow-hidden">
                     {/* Decorative bg */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-copper-DEFAULT/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                     <div className="flex justify-between items-start mb-6 relative z-10">
                         <div>
                             <h3 className="font-serif text-2xl text-white mb-2">{poll.title}</h3>
                             <p className="text-gray-400 leading-relaxed max-w-xl">{poll.description}</p>
                         </div>
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${!isExpired ? 'border-copper-DEFAULT/30 text-copper-light bg-copper-DEFAULT/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                             <Clock size={14} />
                             {!isExpired ? `${daysLeft} dias restantes` : 'Encerrado'}
                         </div>
                     </div>

                     <div className="space-y-4 relative z-10">
                         {poll.options.map((option) => {
                             const count = poll.results?.[option] || 0;
                             const percentage = getPercentage(count, poll.total_votes || 0);
                             const isSelected = selections[poll.id] === option;
                             // Fix: Explicitly cast Object.values to number[] to avoid 'unknown' spread error on line 174
                             const isWinner = hasVoted && Math.max(...(Object.values(poll.results || {}) as number[])) === count && count > 0;

                             return (
                                 <div 
                                    key={option}
                                    onClick={() => !hasVoted && !isExpired && setSelections({ ...selections, [poll.id]: option })}
                                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                                        hasVoted 
                                            ? 'border-white/5 bg-white/[0.02]' 
                                            : isSelected 
                                                ? 'border-copper-DEFAULT bg-copper-DEFAULT/10 cursor-pointer' 
                                                : isExpired
                                                  ? 'border-white/5 opacity-60 cursor-not-allowed'
                                                  : 'border-white/10 hover:border-white/30 cursor-pointer hover:bg-white/5'
                                    }`}
                                 >
                                     {/* Progress Bar Background (Only if voted) */}
                                     {hasVoted && (
                                         <div 
                                            className="absolute inset-0 bg-gradient-to-r from-copper-dark/20 to-copper-DEFAULT/20 rounded-xl transition-all duration-1000 ease-out" 
                                            style={{ width: `${percentage}%` }}
                                         ></div>
                                     )}

                                     <div className="relative flex justify-between items-center z-10">
                                         <div className="flex items-center gap-3">
                                             {!hasVoted ? (
                                                 <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-copper-DEFAULT' : 'border-gray-500'}`}>
                                                     {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-copper-DEFAULT"></div>}
                                                 </div>
                                             ) : (
                                                 <div className="w-5 h-5 flex items-center justify-center">
                                                     {poll.user_voted_option === option ? <CheckCircle2 size={20} className="text-copper-light" /> : null}
                                                 </div>
                                             )}
                                             <span className={`font-medium ${hasVoted && poll.user_voted_option === option ? 'text-copper-light' : 'text-gray-200'}`}>
                                                 {option}
                                             </span>
                                         </div>
                                         
                                         {hasVoted && (
                                             <div className="flex items-center gap-3">
                                                {isWinner && <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">Liderando</span>}
                                                <span className="font-mono font-bold text-white">{percentage}%</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>

                     {!hasVoted && !isExpired && (
                         <div className="mt-8 flex justify-end">
                             <button 
                                onClick={() => handleVote(poll.id)}
                                disabled={!selections[poll.id]}
                                className="bg-copper-gradient text-black px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-copper-DEFAULT/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                             >
                                 Confirmar Voto
                             </button>
                         </div>
                     )}

                     {hasVoted && (
                         <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
                             <div className="flex items-center gap-2">
                                 <BarChart2 size={16} />
                                 <span>{poll.total_votes} votos totais</span>
                             </div>
                             <span>Seu voto foi registrado com segurança.</span>
                         </div>
                     )}
                </div>
            );
        })}
      </div>

      {/* Modal Criar Enquete */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-[#121212] rounded-2xl border border-white/10 w-full max-w-lg relative z-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-serif text-xl text-white">Criar Nova Enquete</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleCreatePoll} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Título</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none placeholder-gray-700"
                            placeholder="Ex: Tema da Festa"
                            value={newPoll.title}
                            onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Descrição</label>
                        <textarea 
                            rows={2}
                            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none placeholder-gray-700 resize-none"
                            placeholder="Descreva o objetivo desta votação..."
                            value={newPoll.description}
                            onChange={(e) => setNewPoll({...newPoll, description: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Prazo de Encerramento</label>
                         <input 
                            type="datetime-local"
                            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none [color-scheme:dark]"
                            value={newPoll.deadline}
                            onChange={(e) => setNewPoll({...newPoll, deadline: e.target.value})}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="block text-xs font-bold text-copper-light uppercase tracking-wider">Opções de Voto</label>
                           <button type="button" onClick={addOption} className="text-xs text-copper-DEFAULT hover:text-white font-bold flex items-center gap-1">
                              <Plus size={12} /> Adicionar Opção
                           </button>
                        </div>
                        {newPoll.options.map((option, index) => (
                           <div key={index} className="flex gap-2">
                              <input 
                                  required
                                  type="text" 
                                  className="flex-1 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none placeholder-gray-700 text-sm"
                                  placeholder={`Opção ${index + 1}`}
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, e.target.value)}
                              />
                              {newPoll.options.length > 2 && (
                                <button type="button" onClick={() => removeOption(index)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                                   <Trash2 size={16} />
                                </button>
                              )}
                           </div>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 bg-copper-gradient text-black font-bold rounded-lg shadow-lg hover:shadow-copper-DEFAULT/20 transition flex justify-center items-center gap-2 transform active:scale-95"
                        >
                            <CheckCircle2 size={18} /> Criar Votação
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default VotingTab;
