
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  RefreshCw, Trophy, Star, AlertTriangle, 
  RotateCcw, ShieldCheck, Crown, Loader2,
  HelpCircle, X, CheckCircle2
} from 'lucide-react';

type Grid = number[][];

interface GameState {
  grid: Grid;
  score: number;
}

interface RankingEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

const TILE_STYLES: Record<number, { label: string; container: string; text: string; sub: string }> = {
  2: { label: 'Calouro', container: 'bg-zinc-800 border-zinc-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]', text: 'text-zinc-400', sub: 'Matrícula' },
  4: { label: 'Provas', container: 'bg-slate-900 border-blue-900/50 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]', text: 'text-blue-400', sub: 'NP1 & NP2' },
  8: { label: 'Trabalhos', container: 'bg-[#052c16] border-emerald-900 shadow-[inset_0_2px_10px_rgba(16,185,129,0.1)]', text: 'text-emerald-400', sub: 'Grupo' },
  16: { label: 'DP', container: 'bg-[#450a0a] border-red-900 shadow-[inset_0_2px_10px_rgba(239,68,68,0.2)]', text: 'text-red-400 font-black', sub: 'Perigo' },
  32: { label: 'Estágio', container: 'bg-[#2e1065] border-purple-900 shadow-[inset_0_2px_10px_rgba(139,92,246,0.2)]', text: 'text-purple-300', sub: '6 Horas' },
  64: { label: 'TCC', container: 'bg-[#7c2d12] border-orange-900 shadow-[inset_0_2px_10px_rgba(249,115,22,0.2)]', text: 'text-orange-200', sub: 'Banca' },
  128: { label: 'Formado!', container: 'bg-gradient-to-br from-copper-dark via-copper-DEFAULT to-copper-light border-copper-light/30 shadow-[0_10px_20px_rgba(140,82,67,0.4)]', text: 'text-black font-black', sub: 'Canudo' },
  256: { label: 'Sócio Jr', container: 'bg-gradient-to-br from-[#1c1917] via-[#44403c] to-[#1c1917] border-[#b87333]/40 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]', text: 'text-[#EBC0A0] font-bold', sub: 'Contrato' },
  512: { label: 'Networking', container: 'bg-gradient-to-br from-slate-400 via-slate-100 to-slate-400 border-white/50 shadow-[0_15px_30px_rgba(255,255,255,0.1)]', text: 'text-slate-900 font-black', sub: 'Contatos' },
  1024: { label: 'Investidor', container: 'bg-gradient-to-br from-yellow-700 via-yellow-200 to-yellow-600 border-yellow-100/50 shadow-[0_20px_40px_rgba(234,179,8,0.3)]', text: 'text-yellow-900 font-black', sub: 'Patrimônio' },
  2048: { label: 'SECRET CLUB', container: 'bg-gradient-to-tr from-copper-light via-white to-copper-light border-white shadow-[0_0_50px_rgba(255,255,255,0.6)] animate-pulse', text: 'text-copper-dark font-black tracking-tighter', sub: 'O ÁPICE' },
};

const GRID_SIZE = 4;
const UNDO_LIMIT = 5;
const SWIPE_THRESHOLD = 50;

const SecretClubGame2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<GameState[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [lastMergedPos, setLastMergedPos] = useState<{r: number, c: number} | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isRankLoading, setIsRankLoading] = useState(false);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setIsRankLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('game_ranking')
          .select('*')
          .order('score', { ascending: false })
          .limit(10);
        if (!error && data) setRanking(data);
      } else {
        setRanking([
          { id: '1', player_name: 'Ana Presidente', score: 25400, created_at: '' },
          { id: '2', player_name: 'Carlos Tesouraria', score: 18200, created_at: '' },
          { id: '3', player_name: 'Bia Marketing', score: 12500, created_at: '' },
        ]);
      }
    } finally {
      setIsRankLoading(false);
    }
  };

  const spawnTile = useCallback((currentGrid: Grid): Grid => {
    const emptyCells: { r: number, c: number }[] = [];
    currentGrid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push({ r, c });
      });
    });
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
    setHistory([]);
    setStatus('playing');
    setHasSaved(false);
    setPlayerName('');
    setLastMergedPos(null);
  }, [spawnTile]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const saveScoreToSupabase = async () => {
    if (!playerName.trim() || isSaving || hasSaved) return;
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('game_ranking')
          .insert([{ player_name: playerName, score }]);
        if (!error) {
          setHasSaved(true);
          fetchRanking();
        }
      } else {
        setRanking(prev => [{ id: Date.now().toString(), player_name: playerName, score, created_at: '' }, ...prev].sort((a,b) => b.score - a.score).slice(0, 10));
        setHasSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveHistory = (currentGrid: Grid, currentScore: number) => {
    const newState = { grid: currentGrid.map(row => [...row]), score: currentScore };
    setHistory(prev => [newState, ...prev].slice(0, UNDO_LIMIT));
  };

  const handleUndo = () => {
    if (history.length === 0 || status !== 'playing') return;
    const [lastState, ...remainingHistory] = history;
    setGrid(lastState.grid);
    setScore(lastState.score);
    setHistory(remainingHistory);
    setLastMergedPos(null);
  };

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (status !== 'playing') return;
    let moved = false;
    let newScore = score;
    let newGrid = grid.map(row => [...row]);
    let mergedAt: {r: number, c: number} | null = null;

    const rotateGrid = (gridToRotate: Grid) => gridToRotate[0].map((_, index) => gridToRotate.map(row => row[index]).reverse());
    
    let rotations = 0;
    if (direction === 'UP') rotations = 1;
    if (direction === 'RIGHT') rotations = 2;
    if (direction === 'DOWN') rotations = 3;

    for (let i = 0; i < rotations; i++) newGrid = rotateGrid(newGrid);

    for (let r = 0; r < GRID_SIZE; r++) {
      let row = newGrid[r].filter(val => val !== 0);
      for (let c = 0; c < row.length - 1; c++) {
        if (row[c] === row[c + 1]) {
          row[c] *= 2;
          newScore += row[c];
          row.splice(c + 1, 1);
          moved = true;
          mergedAt = {r, c};
        }
      }
      const newRow = row.concat(Array(GRID_SIZE - row.length).fill(0));
      if (newRow.join(',') !== newGrid[r].join(',')) moved = true;
      newGrid[r] = newRow;
    }

    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotateGrid(newGrid);

    if (moved) {
      saveHistory(grid, score);
      const finalGrid = spawnTile(newGrid);
      setGrid(finalGrid);
      setScore(newScore);
      setLastMergedPos(mergedAt);

      let has2048 = false;
      let canMove = false;
      finalGrid.forEach(row => row.forEach(cell => {
        if (cell === 2048) has2048 = true;
        if (cell === 0) canMove = true;
      }));
      if (!canMove) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (c < GRID_SIZE - 1 && finalGrid[r][c] === finalGrid[r][c + 1]) canMove = true;
            if (r < GRID_SIZE - 1 && finalGrid[r][c] === finalGrid[r + 1][c]) canMove = true;
          }
        }
      }
      if (has2048) setStatus('won');
      else if (!canMove) setStatus('lost');
    }
  }, [grid, score, status, spawnTile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (arrowKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') move('UP');
        if (e.key === 'ArrowDown') move('DOWN');
        if (e.key === 'ArrowLeft') move('LEFT');
        if (e.key === 'ArrowRight') move('RIGHT');
      }
      
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, handleUndo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > SWIPE_THRESHOLD) {
      // Logic to prevent scroll during play
      if (absDx > absDy) {
        move(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        move(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    setTouchStart(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only prevent default if we're actually playing and touching the grid
    if (status === 'playing') {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full animate-in fade-in duration-700">
      
      <style>{`
        @keyframes tile-appear {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tile-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-appear { animation: tile-appear 150ms ease-out forwards; }
        .animate-pop { animation: tile-pop 150ms ease-in-out forwards; }
      `}</style>

      {/* HUD Superior */}
      <div className="w-full mb-6 flex flex-col lg:flex-row justify-between items-center gap-4 max-w-[900px]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="font-serif text-3xl md:text-4xl text-white italic tracking-tighter mb-1 drop-shadow-2xl">Atlas 2048</h2>
            <div className="flex items-center gap-2 text-copper-light/60 text-[10px] uppercase font-black tracking-[0.3em]">
               <ShieldCheck size={12} /> Membership Board
            </div>
          </div>
          
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-copper-light hover:bg-white/10 transition-all group"
            title="Guia de Hierarquia"
          >
            <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl px-5 py-2 shadow-2xl flex flex-col items-end min-w-[140px]">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Saldo de Carreira</span>
            <span className="text-lg md:text-xl font-serif font-bold text-transparent bg-clip-text bg-copper-gradient italic">R$ {score.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-center xl:items-start justify-center w-full max-w-[1100px]">
        
        {/* Jogo */}
        <div className="flex flex-col items-center space-y-4 flex-shrink-0 w-full max-w-[380px]">
          <div 
            className="relative bg-[#050505] p-3 rounded-[1.8rem] border-[3px] border-[#1a1a1a] shadow-2xl select-none w-full aspect-square touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <div className="grid grid-cols-4 gap-2 bg-[#0a0a0a] rounded-[1.4rem] p-2 h-full w-full">
              {grid.map((row, r) => row.map((cell, c) => {
                const style = TILE_STYLES[cell];
                return (
                  <div 
                    key={`${r}-${c}-${cell}`} 
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 transform border relative ${
                        style 
                        ? `${style.container} ${lastMergedPos?.r === r && lastMergedPos?.c === c ? 'animate-pop' : 'animate-appear'}` 
                        : 'bg-black/40 border-white/5 shadow-inner'
                    }`}
                  >
                    {style && (
                      <>
                        <span className={`text-[5px] uppercase font-black tracking-widest text-center px-1 leading-none mb-1 opacity-70 ${style.text}`}>{style.sub}</span>
                        <span className={`text-[7px] md:text-[8px] uppercase font-bold text-center px-1 leading-tight drop-shadow-sm ${style.text}`}>{style.label}</span>
                        {cell >= 128 && <div className="absolute top-1 right-1"><Star size={6} className={style.text} fill="currentColor" /></div>}
                      </>
                    )}
                  </div>
                );
              }))}
            </div>

            {/* Overlays */}
            {status !== 'playing' && (
              <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md rounded-[1.8rem] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
                {status === 'won' ? (
                  <div className="mb-4">
                    <Crown size={32} className="text-yellow-400 mx-auto mb-2 animate-bounce" />
                    <h3 className="font-serif text-xl text-white italic mb-1">O Ápice!</h3>
                  </div>
                ) : (
                  <div className="mb-4">
                    <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
                    <h3 className="font-serif text-xl text-white italic mb-1">Fim de Jogo</h3>
                  </div>
                )}
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mb-4">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Resultado Final</span>
                  <div className="text-xl font-serif text-copper-light font-bold mb-4 italic">R$ {score.toLocaleString('pt-BR')}</div>
                  
                  {!hasSaved ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Seu Nome" 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-copper-light outline-none"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                      <button 
                        onClick={saveScoreToSupabase}
                        disabled={!playerName.trim() || isSaving}
                        className="w-full bg-copper-gradient text-black py-2 rounded-lg font-bold text-[9px] uppercase tracking-widest flex justify-center items-center gap-2"
                      >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Salvar Recorde'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-[9px] uppercase">
                       <CheckCircle2 size={14} /> Recorde Salvo
                    </div>
                  )}
                </div>

                <button onClick={resetGame} className="text-gray-500 hover:text-white text-[9px] font-bold uppercase flex items-center gap-2 transition-colors">
                  <RefreshCw size={10} /> Reiniciar
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
              <button 
                onClick={handleUndo} 
                disabled={history.length === 0 || status !== 'playing'} 
                className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white disabled:opacity-20 transition-all shadow-lg"
              >
                <RotateCcw size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest">Desfazer</span>
              </button>
              <button 
                onClick={resetGame} 
                className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-red-400 transition-all shadow-lg"
              >
                <RefreshCw size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest">Resetar</span>
              </button>
          </div>
          
          <p className="text-[9px] text-gray-600 uppercase tracking-widest font-medium italic animate-pulse">
            Use as setas ou deslize para mover
          </p>
        </div>

        {/* Leaderboard */}
        <div className="w-full xl:max-w-[320px] space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Trophy className="text-copper-light" size={20} />
                <h3 className="font-serif text-xl text-white italic">Conselho de Elite</h3>
            </div>
            
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[1.6rem] p-4 shadow-2xl relative overflow-hidden min-h-[340px]">
                <div className="space-y-2 relative z-10">
                    {isRankLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-600 italic">
                           <Loader2 className="animate-spin mb-3 text-copper-DEFAULT" size={20} />
                           Carregando...
                        </div>
                    ) : ranking.length > 0 ? (
                        ranking.map((entry, index) => {
                            const isTop3 = index < 3;
                            return (
                                <div key={entry.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isTop3 ? 'bg-white/[0.04] border-white/10' : 'border-transparent'}`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${
                                            index === 0 ? 'bg-gradient-to-tr from-yellow-500 to-yellow-200 text-yellow-950 shadow-lg' :
                                            index === 1 ? 'bg-slate-300 text-slate-950' :
                                            index === 2 ? 'bg-copper-dark text-white' :
                                            'bg-white/5 text-gray-500'
                                        }`}>
                                            {index === 0 ? <Crown size={12} /> : index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-bold ${isTop3 ? 'text-white' : 'text-gray-400'}`}>{entry.player_name}</span>
                                            <span className="text-[7px] text-gray-600 uppercase tracking-widest font-black">IBMEC LVL {10 - index}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-serif italic ${isTop3 ? 'text-copper-light font-black' : 'text-gray-500'}`}>R$ {entry.score.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center text-gray-700 italic text-xs">Aguardando records...</div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Manual de Carreira */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsGuideOpen(false)}></div>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-[1.8rem] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-copper-light" size={18} />
                <h3 className="font-serif text-lg text-white italic">Hierarquia Atlas</h3>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-white">
                <X size={18}/>
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                {Object.entries(TILE_STYLES).map(([val, style]) => (
                    <div key={val} className="flex items-center gap-3 p-2 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-all">
                        <div className={`w-10 h-10 rounded-lg shrink-0 flex flex-col items-center justify-center border-2 ${style.container}`}>
                            <span className={`text-[7px] font-bold ${style.text}`}>{val}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-[9px] uppercase tracking-widest ${style.text}`}>{style.label}</h4>
                            <p className="text-[7px] text-gray-600 font-medium">{style.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretClubGame2048;
