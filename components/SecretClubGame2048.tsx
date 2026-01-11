
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  RefreshCw, Trophy, ArrowRight, Star, AlertTriangle, 
  RotateCcw, ShieldCheck, Crown, Medal, User, Send, Loader2,
  HelpCircle, X, ChevronRight, CheckCircle2
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
  16: { label: 'DP', container: 'bg-[#450a0a] border-red-900 shadow-[inset_0_2px_10px_rgba(239,68,68,0.2)] animate-pulse', text: 'text-red-400 font-black', sub: 'Perigo' },
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

const SecretClubGame2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<GameState[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  
  // Modals & UX States
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
  };

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (status !== 'playing') return;
    let moved = false;
    let newScore = score;
    let newGrid = grid.map(row => [...row]);
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

  // DESKTOP: Prevent scroll on Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault(); // STOP SCROLL
      }
      if (['ArrowUp', 'w', 'W'].includes(e.key)) move('UP');
      if (['ArrowDown', 's', 'S'].includes(e.key)) move('DOWN');
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) move('LEFT');
      if (['ArrowRight', 'd', 'D'].includes(e.key)) move('RIGHT');
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) handleUndo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, handleUndo]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    // Forgiving threshold
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'RIGHT' : 'LEFT');
      else move(dy > 0 ? 'DOWN' : 'UP');
    }
    setTouchStart(null);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start py-8 xl:py-12 animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HUD Superior */}
      <div className="w-full max-w-7xl px-4 xl:px-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h2 className="font-serif text-5xl text-white italic tracking-tighter mb-1 drop-shadow-2xl">Atlas 2048</h2>
            <div className="flex items-center gap-2 text-copper-light/60 text-[10px] uppercase font-black tracking-[0.3em]">
               <ShieldCheck size={12} /> Membership Board
            </div>
          </div>
          
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-copper-light hover:bg-white/10 transition-all group shadow-xl"
            title="Guia de Hierarquia"
          >
            <HelpCircle size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl px-8 py-3 shadow-2xl flex flex-col items-end min-w-[180px]">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Saldo de Carreira</span>
                <span className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-copper-gradient italic">R$ {score.toLocaleString('pt-BR')}</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 xl:gap-24 items-center xl:items-start justify-center w-full max-w-7xl px-4">
        
        {/* Lado Esquerdo: O Jogo */}
        <div className="flex flex-col items-center space-y-10 flex-shrink-0">
          <div 
            style={{ touchAction: 'none' }} // CRITICAL: Stop mobile scroll
            className="relative bg-[#050505] p-5 rounded-[2.5rem] border-[6px] border-[#1a1a1a] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.05)] select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-4 gap-3 sm:gap-4 bg-[#0a0a0a] rounded-[1.5rem] p-3 sm:p-4">
              {grid.map((row, r) => row.map((cell, c) => {
                const style = TILE_STYLES[cell];
                return (
                  <div key={`${r}-${c}`} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform border-2 relative ${style ? `${style.container} scale-100` : 'bg-black/40 border-white/5 scale-95 shadow-inner'}`}>
                    {style && (
                      <>
                        <span className={`text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-center px-1 leading-none mb-1 opacity-70 ${style.text}`}>{style.sub}</span>
                        <span className={`text-[9px] sm:text-[11px] uppercase font-bold text-center px-1 leading-tight drop-shadow-sm ${style.text}`}>{style.label}</span>
                        {cell >= 128 && <div className="absolute top-1 right-1"><Star size={8} className={style.text} fill="currentColor" /></div>}
                      </>
                    )}
                  </div>
                );
              }))}
            </div>

            {/* Overlays */}
            {status !== 'playing' && (
              <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
                {status === 'won' ? (
                  <div className="mb-6">
                    <Crown size={60} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h3 className="font-serif text-3xl text-white italic mb-2 tracking-tight">O Ápice da Carreira!</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">Você entrou no Clube Secreto.</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <AlertTriangle size={60} className="text-red-500 mx-auto mb-4" />
                    <h3 className="font-serif text-3xl text-white italic mb-2 tracking-tight">Tente o Ano Que Vem...</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">A jornada foi interrompida.</p>
                  </div>
                )}
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full mb-8 shadow-inner">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Resultado Final</span>
                  <div className="text-3xl font-serif text-copper-light font-bold mb-6 italic tracking-tighter">R$ {score.toLocaleString('pt-BR')}</div>
                  
                  {!hasSaved ? (
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Nome para o Ranking" 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-copper-light outline-none transition"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                      <button 
                        onClick={saveScoreToSupabase}
                        disabled={!playerName.trim() || isSaving}
                        className="w-full bg-copper-gradient text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex justify-center items-center gap-2 hover:-translate-y-0.5 transition active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Salvar Recorde</>}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-xs uppercase animate-in fade-in">
                       <CheckCircle2 size={18} /> Recorde Eternizado!
                    </div>
                  )}
                </div>

                <button 
                  onClick={resetGame}
                  className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition px-6 py-2 rounded-lg hover:bg-white/5"
                >
                  <RefreshCw size={14} /> Nova Jornada
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full max-w-[420px] px-2">
              <button 
                onClick={handleUndo} 
                disabled={history.length === 0 || status !== 'playing'} 
                className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/10 transition active:scale-95 disabled:opacity-20 group shadow-lg"
              >
                <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Voltar</span>
                    <span className="text-[9px] text-gray-600 font-bold">{history.length} slots</span>
                </div>
              </button>
              <button 
                onClick={resetGame} 
                className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition active:scale-95 group shadow-lg"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Resetar</span>
                    <span className="text-[9px] text-gray-600 font-bold">Zerar Tabela</span>
                </div>
              </button>
          </div>
        </div>

        {/* Lado Direito: Leaderboard */}
        <div className="w-full max-w-[400px] space-y-8 mt-12 xl:mt-0">
            <div className="flex items-center gap-3 mb-2 px-4">
                <Trophy className="text-copper-light" size={28} />
                <h3 className="font-serif text-3xl text-white italic tracking-tight">Conselho de Elite</h3>
            </div>
            
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden min-h-[520px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-copper-DEFAULT/5 blur-[80px] rounded-full"></div>
                
                <div className="space-y-4 relative z-10">
                    {isRankLoading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-gray-600 italic font-serif">
                           <Loader2 className="animate-spin mb-4 text-copper-DEFAULT" size={32} />
                           Consultando Banco de Dados...
                        </div>
                    ) : ranking.length > 0 ? (
                        ranking.map((entry, index) => {
                            const isTop3 = index < 3;
                            return (
                                <div 
                                    key={entry.id} 
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isTop3 ? 'bg-white/[0.04] border-white/10 shadow-lg' : 'border-transparent hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                                            index === 0 ? 'bg-gradient-to-tr from-yellow-500 to-yellow-200 text-yellow-950 shadow-[0_0_20px_rgba(234,179,8,0.4)]' :
                                            index === 1 ? 'bg-slate-300 text-slate-950' :
                                            index === 2 ? 'bg-copper-dark text-white' :
                                            'bg-white/5 text-gray-500'
                                        }`}>
                                            {index === 0 ? <Crown size={16} /> : index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold tracking-tight ${isTop3 ? 'text-white' : 'text-gray-400'}`}>{entry.player_name}</span>
                                            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black">IBMEC LEVEL {10 - index}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-base font-serif italic ${isTop3 ? 'text-copper-light font-black' : 'text-gray-500'}`}>R$ {entry.score.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-24 text-center text-gray-700 italic font-serif opacity-40">
                           O Hall of Fame aguarda o primeiro membro.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-copper-DEFAULT/5 border border-copper-DEFAULT/10 rounded-[1.5rem] p-6 shadow-xl flex items-start gap-4">
                <Medal className="text-copper-light shrink-0 mt-1" size={20} />
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-copper-light opacity-80">Atlas Rewards</span>
                   <p className="text-gray-500 text-[11px] leading-relaxed italic">
                        Alcance o <strong className="text-white">Clube Secreto</strong> para desbloquear benefícios exclusivos no encerramento 2026.
                   </p>
                </div>
            </div>
        </div>

      </div>

      {/* MODAL: Guia de Hierarquia (Membership Rulebook) */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsGuideOpen(false)}></div>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-copper-light" size={24} />
                <h3 className="font-serif text-2xl text-white italic tracking-tight">Manual de Carreira Atlas</h3>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-white transition-all p-2 rounded-full hover:bg-white/5">
                <X size={24}/>
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <p className="text-gray-500 text-xs font-light mb-8 italic text-center">Combine os cards para subir na hierarquia do sucesso corporativo.</p>
                
                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(TILE_STYLES).map(([val, style]) => (
                        <div key={val} className="flex items-center gap-6 p-3 rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all group">
                            <div className={`w-14 h-14 rounded-xl shrink-0 flex flex-col items-center justify-center border-2 ${style.container} group-hover:scale-105 transition-transform`}>
                                <span className={`text-[9px] font-bold ${style.text}`}>{val}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm uppercase tracking-widest ${style.text}`}>{style.label}</h4>
                                <p className="text-[10px] text-gray-600 font-medium">{style.sub}</p>
                            </div>
                            <div className="text-gray-800">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-city-black/50 border-t border-white/5 text-center">
                <button 
                  onClick={() => setIsGuideOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Entendido, Comandante
                </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Bloqueio global de scroll ao interagir com o tabuleiro */
        body.playing-game {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default SecretClubGame2048;
