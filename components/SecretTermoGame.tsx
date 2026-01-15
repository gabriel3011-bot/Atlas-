
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { RefreshCw, Trophy, Crown, Loader2, Save, User as UserIcon, Delete, CornerDownLeft, Star, HelpCircle } from 'lucide-react';

const WORDS = [
  'ATLAS', 'VOTOS', 'FESTA', 'SENHA', 'LIDER', 'PODER', 'METAS', 'SONHO', 
  'HONRA', 'UNIAO', 'NOITE', 'IDEAL', 'MUNDO', 'GRUPO', 'EVENT', 'HOTEL', 
  'TERRA', 'DIRET', 'CLUBE', 'PRECO', 'CUSTO', 'VALOR', 'SALDO', 'LUCRO'
];

interface RankingEntry { player_name: string; score: number; created_at: string; }

const SecretTermoGame: React.FC = () => {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState<string[]>(Array(6).fill(''));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeRow, setShakeRow] = useState<number | null>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Game
  useEffect(() => {
    startNewGame();
    fetchLeaderboard();
  }, []);

  const startNewGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(randomWord);
    setGuesses(Array(6).fill(''));
    setCurrentGuessIndex(0);
    setCurrentGuess('');
    setGameStatus('playing');
    setShakeRow(null);
    console.log("Secret Word:", randomWord); // For debug/cheating ;)
  };

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoadingRanking(true);
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('player_name, score, created_at')
        .eq('game_type', 'termo')
        .order('score', { ascending: false })
        .limit(10);
      if (error) throw error;
      if (data) setLeaderboard(data);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  // Input Handling
  const handleKey = useCallback((key: string) => {
    if (gameStatus !== 'playing' || showSaveModal) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setShakeRow(currentGuessIndex);
        setTimeout(() => setShakeRow(null), 500);
        return;
      }
      
      const newGuesses = [...guesses];
      newGuesses[currentGuessIndex] = currentGuess;
      setGuesses(newGuesses);
      
      if (currentGuess === solution) {
        setGameStatus('won');
        setShowSaveModal(true);
      } else if (currentGuessIndex === 5) {
        setGameStatus('lost');
        setShowSaveModal(true); // Maybe save score 0 or just show loss
      } else {
        setCurrentGuessIndex(prev => prev + 1);
        setCurrentGuess('');
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  }, [currentGuess, currentGuessIndex, gameStatus, guesses, solution, showSaveModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKey]);

  const calculateScore = () => {
    // Simple scoring: 6 attempts = 6000pts, 1 attempt = 1000pts ? 
    // Let's do: Base 1000 - (attempts * 100)
    // Attempt 1: 6000 (Bonus for luck/skill)
    // Attempt 2: 5000
    // Attempt 3: 4000
    // Attempt 4: 3000
    // Attempt 5: 2000
    // Attempt 6: 1000
    const attemptsUsed = currentGuessIndex + 1;
    if (gameStatus === 'lost') return 0;
    return (7 - attemptsUsed) * 1000;
  };

  const saveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalScore = calculateScore();
    if (!playerName.trim() || finalScore <= 0) {
        setShowSaveModal(false);
        return;
    }
    
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('game_scores').insert([{
          player_name: playerName,
          score: finalScore,
          game_type: 'termo'
        }]);
        if (error) throw error;
        await fetchLeaderboard();
      }
      setShowSaveModal(false);
      // Wait a bit before resetting so user sees the change
      setTimeout(startNewGame, 500);
    } catch (err) {
      alert("Erro ao salvar pontuação.");
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard Render Helpers
  const getKeyStatus = (key: string) => {
    let status = 'default';
    for (let i = 0; i < currentGuessIndex; i++) {
      const guess = guesses[i];
      for (let j = 0; j < 5; j++) {
        if (guess[j] === key) {
          if (solution[j] === key) return 'correct';
          if (solution.includes(key)) status = 'present';
          else if (status === 'default') status = 'absent';
        }
      }
    }
    return status;
  };

  const KeyboardKey = ({ k, special = false, icon }: { k: string, special?: boolean, icon?: React.ReactNode }) => {
    const status = getKeyStatus(k);
    let bgClass = 'bg-[#1a1a1a] border-white/5 text-gray-300 hover:bg-white/10';
    
    if (!special) {
      if (status === 'correct') bgClass = 'bg-emerald-600 border-emerald-500 text-white';
      else if (status === 'present') bgClass = 'bg-yellow-600 border-yellow-500 text-white';
      else if (status === 'absent') bgClass = 'bg-zinc-800 border-transparent text-gray-600 opacity-50';
    } else {
        bgClass = 'bg-copper-DEFAULT/20 border-copper-DEFAULT/30 text-copper-light hover:bg-copper-DEFAULT/30';
    }

    return (
      <button
        onClick={() => handleKey(k)}
        className={`
          ${special ? 'px-3 md:px-6' : 'flex-1'} 
          h-12 md:h-14 rounded-lg font-bold text-xs md:text-sm border transition-all duration-150 active:scale-95 flex items-center justify-center
          ${bgClass}
        `}
      >
        {icon || k}
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 w-full max-w-6xl py-4">
      
      {/* Game Area */}
      <div className="flex flex-col items-center w-full max-w-[420px]">
        
        {/* Header */}
        <div className="w-full mb-6 flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-copper-DEFAULT/10 rounded-lg">
                <HelpCircle size={18} className="text-copper-light" />
             </div>
             <div>
                <h3 className="font-serif text-xl text-white italic">Senha do Dia</h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Adivinhe a palavra</p>
             </div>
          </div>
          <button onClick={startNewGame} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition">
             <RefreshCw size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-rows-6 gap-2 mb-8 w-full px-4 md:px-0">
          {guesses.map((guess, i) => {
            const isCurrent = i === currentGuessIndex;
            const isCompleted = i < currentGuessIndex;
            const letters = isCurrent ? currentGuess.padEnd(5, ' ').split('') : guess.padEnd(5, ' ').split('');
            
            return (
              <div 
                key={i} 
                className={`grid grid-cols-5 gap-2 ${shakeRow === i ? 'animate-shake' : ''}`}
              >
                {letters.map((letter, j) => {
                  let statusClass = 'bg-black/40 border-white/10 text-white';
                  if (isCompleted) {
                    if (letter === solution[j]) statusClass = 'bg-emerald-600 border-emerald-500 text-white';
                    else if (solution.includes(letter)) statusClass = 'bg-yellow-600 border-yellow-500 text-white';
                    else statusClass = 'bg-zinc-800 border-transparent text-gray-500';
                  } else if (isCurrent && letter.trim()) {
                    statusClass = 'bg-white/5 border-copper-light/50 text-white shadow-[0_0_10px_rgba(197,131,106,0.1)]';
                  }

                  return (
                    <div 
                      key={j} 
                      className={`
                        aspect-square rounded-xl border-2 flex items-center justify-center text-2xl font-black font-sans transition-all duration-300
                        ${statusClass}
                      `}
                    >
                      {letter.trim()}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Keyboard */}
        <div className="w-full space-y-2 px-1">
           <div className="flex gap-1.5">
              {['Q','W','E','R','T','Y','U','I','O','P'].map(k => <KeyboardKey key={k} k={k} />)}
           </div>
           <div className="flex gap-1.5 px-4">
              {['A','S','D','F','G','H','J','K','L'].map(k => <KeyboardKey key={k} k={k} />)}
           </div>
           <div className="flex gap-1.5">
              <KeyboardKey k="ENTER" special icon={<CornerDownLeft size={16} />} />
              {['Z','X','C','V','B','N','M'].map(k => <KeyboardKey key={k} k={k} />)}
              <KeyboardKey k="BACKSPACE" special icon={<Delete size={16} />} />
           </div>
        </div>

      </div>

      {/* Hall of Fame (Sidebar) */}
      <div className="w-full lg:max-w-[340px] bg-[#0d0d0d]/80 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full min-h-[500px] flex flex-col animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-copper-DEFAULT/10 rounded-xl">
            <Trophy size={20} className="text-copper-light" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">🏆 Ranking Termo</h3>
            <p className="text-[10px] text-gray-500 italic">Melhores Decifradores</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {loadingRanking ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="animate-spin text-copper-DEFAULT" size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Lendo Arquivos...</span>
             </div>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:bg-white/[0.04] ${idx < 3 ? 'bg-copper-DEFAULT/5 border-copper-DEFAULT/20' : 'bg-white/[0.02] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`text-[10px] font-black w-6 flex items-center justify-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                    {idx === 0 ? <Crown size={14} /> : `#${idx + 1}`}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-200 tracking-tight">{entry.player_name}</span>
                    <span className="text-[8px] text-gray-600 font-medium uppercase tracking-tighter">{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-serif font-bold text-copper-light italic">{entry.score.toLocaleString()} pts</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <Star className="text-gray-800" size={32} />
               <p className="text-gray-600 font-serif italic text-sm">Nenhum registro encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="bg-[#121212] border border-white/10 rounded-[3rem] w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_80px_rgba(197,131,106,0.1)] animate-in zoom-in duration-300">
            <div className="p-10 text-center border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
               <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border shadow-2xl ${gameStatus === 'won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                 {gameStatus === 'won' ? <Trophy size={40} className="animate-bounce" /> : <Delete size={40} />}
               </div>
               <h3 className="font-serif text-3xl text-white italic mb-2">
                 {gameStatus === 'won' ? 'Senha Desbloqueada!' : 'Acesso Negado'}
               </h3>
               <p className="text-gray-500 text-sm font-light">
                 {gameStatus === 'won' ? 'Missão cumprida com sucesso.' : `A palavra correta era: ${solution}`}
               </p>
            </div>
            
            <form onSubmit={saveScore} className="p-10 space-y-8">
               {gameStatus === 'won' && (
                   <div className="bg-black/50 border border-white/5 rounded-[2rem] p-8 text-center shadow-inner">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block mb-3">PONTUAÇÃO</span>
                      <span className="text-5xl font-serif font-black text-copper-light italic tracking-tighter tabular-nums">
                        {calculateScore()}
                      </span>
                   </div>
               )}

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block text-center">Identificação</label>
                 <div className="relative group">
                   <UserIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                   <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="Seu Nome"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-copper-DEFAULT outline-none transition-all font-medium text-sm shadow-xl"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                   />
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => { setShowSaveModal(false); setTimeout(startNewGame, 300); }} 
                   className="flex-1 py-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                 >
                   Fechar
                 </button>
                 {gameStatus === 'won' && (
                    <button 
                    type="submit" 
                    disabled={isSaving || !playerName.trim()}
                    className="flex-1 bg-copper-gradient text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(197,131,106,0.2)] active:scale-95 transition-all disabled:opacity-50"
                    >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> GRAVAR</>}
                    </button>
                 )}
               </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default SecretTermoGame;
