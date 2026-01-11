
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { RefreshCw, Crown, Trophy, Loader2, Save, User as UserIcon, Medal, Star } from 'lucide-react';

type Grid = number[][];
interface RankingEntry { player_name: string; score: number; created_at: string; }

const GRID_SIZE = 4;
const SWIPE_THRESHOLD = 50;

const TILE_STYLES: Record<number, { label: string; container: string; text: string; sub: string }> = {
  2: { label: 'Calouro', container: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', sub: 'Matrícula' },
  4: { label: 'Provas', container: 'bg-slate-900 border-blue-900/50', text: 'text-blue-400', sub: 'NP1 & NP2' },
  8: { label: 'Trabalhos', container: 'bg-[#052c16] border-emerald-900', text: 'text-emerald-400', sub: 'Grupo' },
  16: { label: 'DP', container: 'bg-[#450a0a] border-red-900', text: 'text-red-400 font-black', sub: 'Perigo' },
  32: { label: 'Estágio', container: 'bg-[#2e1065] border-purple-900', text: 'text-purple-300', sub: '6 Horas' },
  64: { label: 'TCC', container: 'bg-[#7c2d12] border-orange-900', text: 'text-orange-200', sub: 'Banca' },
  128: { label: 'Formado!', container: 'bg-gradient-to-br from-copper-dark via-copper-DEFAULT to-copper-light border-copper-light/30', text: 'text-black font-black', sub: 'Canudo' },
  256: { label: 'Sócio Jr', container: 'bg-gradient-to-br from-[#1c1917] via-[#44403c] to-[#1c1917] border-[#b87333]/40', text: 'text-[#EBC0A0] font-bold', sub: 'Contrato' },
  512: { label: 'Networking', container: 'bg-gradient-to-br from-slate-400 via-slate-100 to-slate-400 border-white/50', text: 'text-slate-900 font-black', sub: 'Contatos' },
  1024: { label: 'Investidor', container: 'bg-gradient-to-br from-yellow-700 via-yellow-200 to-yellow-600 border-yellow-100/50', text: 'text-yellow-900 font-black', sub: 'Patrimônio' },
  2048: { label: 'SECRET CLUB', container: 'bg-gradient-to-tr from-copper-light via-white to-copper-light border-white shadow-[0_0_50px_rgba(255,255,255,0.6)] animate-pulse', text: 'text-copper-dark font-black tracking-tighter', sub: 'O ÁPICE' },
};

const SecretClubGame2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  
  // Leaderboard States
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoadingRanking(true);
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('player_name, score, created_at')
        .eq('game_type', '2048')
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

  const saveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || score <= 0) return;
    
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('game_scores').insert([{
          player_name: playerName,
          score: score,
          game_type: '2048'
        }]);
        if (error) throw error;
        await fetchLeaderboard();
      }
      setShowSaveModal(false);
      resetGame();
    } catch (err) {
      alert("Erro ao salvar pontuação.");
    } finally {
      setIsSaving(false);
    }
  };

  const spawnTile = useCallback((currentGrid: Grid): Grid => {
    const emptyCells: { r: number, c: number }[] = [];
    currentGrid.forEach((row, r) => row.forEach((cell, c) => { if (cell === 0) emptyCells.push({ r, c }); }));
    if (emptyCells.length === 0) return currentGrid;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const resetGame = useCallback(() => {
    let newGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    newGrid = spawnTile(newGrid);
    newGrid = spawnTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setStatus('playing');
  }, [spawnTile]);

  useEffect(() => { 
    resetGame(); 
    fetchLeaderboard();
  }, [resetGame, fetchLeaderboard]);

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (status !== 'playing' || showSaveModal) return;
    let moved = false;
    let newScore = score;
    let newGrid = grid.map(row => [...row]);

    const rotateGrid = (g: Grid) => g[0].map((_, i) => g.map(row => row[i]).reverse());
    let rotations = direction === 'UP' ? 1 : direction === 'RIGHT' ? 2 : direction === 'DOWN' ? 3 : 0;
    for (let i = 0; i < rotations; i++) newGrid = rotateGrid(newGrid);

    for (let r = 0; r < GRID_SIZE; r++) {
      let row = newGrid[r].filter(v => v !== 0);
      for (let c = 0; c < row.length - 1; c++) {
        if (row[c] === row[c + 1]) {
          row[c] *= 2;
          newScore += row[c];
          row.splice(c + 1, 1);
          moved = true;
        }
      }
      const newRow = row.concat(Array(GRID_SIZE - row.length).fill(0));
      if (newRow.join(',') !== newGrid[r].join(',')) moved = true;
      newGrid[r] = newRow;
    }

    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotateGrid(newGrid);

    if (moved) {
      const finalGrid = spawnTile(newGrid);
      setGrid(finalGrid);
      setScore(newScore);

      if (finalGrid.flat().includes(2048)) {
        setStatus('won');
        setShowSaveModal(true);
      } else {
        const canMove = finalGrid.flat().includes(0) || 
          finalGrid.some((row, r) => row.some((val, c) => 
            (c < GRID_SIZE - 1 && val === row[c + 1]) || 
            (r < GRID_SIZE - 1 && val === finalGrid[r + 1][c])
          ));
        
        if (!canMove) {
          setStatus('lost');
          if (newScore > 0) setShowSaveModal(true);
        }
      }
    }
  }, [grid, score, status, spawnTile, showSaveModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') move('UP');
        if (e.key === 'ArrowDown') move('DOWN');
        if (e.key === 'ArrowLeft') move('LEFT');
        if (e.key === 'ArrowRight') move('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 w-full max-w-6xl py-4">
      {/* Game Board Section */}
      <div className="flex flex-col items-center w-full max-w-[420px]">
        <div className="w-full mb-6 flex justify-between items-center bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl shadow-xl">
          <div>
            <h3 className="font-serif text-xl text-white italic">Atlas 2048</h3>
            <p className="text-[9px] text-copper-light uppercase tracking-widest font-black">Escalada Corporativa</p>
          </div>
          <div className="text-right">
              <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 block">PONTOS</span>
              <span className="text-xl font-serif font-bold text-copper-light italic">{score.toLocaleString()}</span>
          </div>
        </div>

        <div 
          className="relative bg-zinc-950 p-2 md:p-3 rounded-[2rem] border-[4px] border-[#1a1a1a] shadow-2xl select-none w-full aspect-square touch-none overflow-hidden"
          onTouchStart={e => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={e => {
            if (!touchStart) return;
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > SWIPE_THRESHOLD) {
              if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'RIGHT' : 'LEFT');
              else move(dy > 0 ? 'DOWN' : 'UP');
            }
            setTouchStart(null);
          }}
        >
          <div className="grid grid-cols-4 gap-2 bg-[#050505] rounded-[1.6rem] p-2 h-full w-full">
            {grid.map((row, r) => row.map((cell, c) => {
              const style = TILE_STYLES[cell];
              return (
                <div 
                  key={`${r}-${c}`} 
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 transform border relative ${
                      style ? style.container : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  {style && (
                    <>
                      <span className={`text-[4px] md:text-[5px] uppercase font-black tracking-widest mb-1 opacity-70 ${style.text}`}>{style.sub}</span>
                      <span className={`text-[6px] md:text-[8px] lg:text-[10px] uppercase font-bold text-center px-1 leading-tight ${style.text}`}>{style.label}</span>
                    </>
                  )}
                </div>
              );
            }))}
          </div>
        </div>
        
        <button onClick={resetGame} className="mt-8 flex items-center gap-2 text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-[0.2em] transition-all hover:scale-105">
          <RefreshCw size={12} /> Reiniciar Tática
        </button>
      </div>

      {/* Hall of Fame Ranking Section */}
      <div className="w-full lg:max-w-[340px] bg-[#0d0d0d]/80 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full min-h-[500px] flex flex-col animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-copper-DEFAULT/10 rounded-xl">
            <Trophy size={20} className="text-copper-light" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">🏆 Hall da Fama</h3>
            <p className="text-[10px] text-gray-500 italic">Top 10 Membros da Atlas</p>
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
                  <span className="text-xs font-serif font-bold text-copper-light italic">pts {entry.score.toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 flex flex-col items-center gap-3">
               <Star className="text-gray-800" size={32} />
               <p className="text-gray-600 font-serif italic text-sm">O trono está vago.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Score Modal - Record Breaker UI */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="bg-[#121212] border border-white/10 rounded-[3rem] w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_80px_rgba(197,131,106,0.1)] animate-in zoom-in duration-300">
            <div className="p-10 text-center border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
               <div className="w-20 h-20 bg-copper-DEFAULT/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-copper-DEFAULT/20 shadow-2xl">
                 <Medal size={40} className="text-copper-light animate-bounce" />
               </div>
               <h3 className="font-serif text-3xl text-white italic mb-2">
                 {status === 'won' ? 'Vitória Absoluta!' : 'Fim da Missão'}
               </h3>
               <p className="text-gray-500 text-sm font-light">Seu desempenho tático garantiu um novo recorde.</p>
            </div>
            
            <form onSubmit={saveScore} className="p-10 space-y-8">
               <div className="bg-black/50 border border-white/5 rounded-[2rem] p-8 text-center shadow-inner">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block mb-3">PONTUAÇÃO FINAL</span>
                  <span className="text-5xl font-serif font-black text-copper-light italic tracking-tighter tabular-nums">
                    {score.toLocaleString()}
                  </span>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block text-center">Identificação do Membro</label>
                 <div className="relative group">
                   <UserIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-copper-light transition-colors" />
                   <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="Nome Sobrenome"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-copper-DEFAULT outline-none transition-all font-medium text-sm shadow-xl"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                   />
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => { setShowSaveModal(false); resetGame(); }} 
                   className="flex-1 py-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                 >
                   Descartar
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSaving || !playerName.trim()}
                   className="flex-1 bg-copper-gradient text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(197,131,106,0.2)] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> GRAVAR RECORDE</>}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretClubGame2048;
