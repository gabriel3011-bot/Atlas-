
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Delete, HelpCircle, X } from 'lucide-react';

const WORDS = ['IBMEC', 'ATLAS', 'CLUBE', 'BAILE', 'FESTA', 'LUCRO', 'JUROS', 'BOLSA', 'RISCO', 'MACRO', 'MICRO', 'QUOTA', 'EXTRA', 'ELITE'];
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

const SecretTermoGame: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const initGame = useCallback(() => {
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
    setMessage(null);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const onKeyClick = useCallback((key: string) => {
    if (gameState !== 'playing') return;
    if (key === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) return;
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');
      if (currentGuess === targetWord) setGameState('won');
      else if (newGuesses.length >= MAX_ATTEMPTS) setGameState('lost');
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, gameState, guesses, targetWord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') onKeyClick('ENTER');
      else if (key === 'BACKSPACE') onKeyClick('BACKSPACE');
      else if (/^[A-Z]$/.test(key)) onKeyClick(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyClick]);

  const getLetterStatus = (guess: string, index: number) => {
    const letter = guess[index];
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-copper-DEFAULT border-copper-DEFAULT text-white';
      case 'present': return 'bg-copper-light/40 border-copper-light text-white';
      case 'absent': return 'bg-zinc-800 border-zinc-700 text-zinc-500';
      default: return 'bg-transparent border-white/10 text-white';
    }
  };

  const Keyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    return (
      <div className="w-full max-w-lg space-y-2 mt-8 px-1">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 md:gap-1.5 flex-wrap">
            {row.map(key => {
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
              return (
                <button
                  key={key}
                  onClick={() => onKeyClick(key)}
                  className={`
                    ${isSpecial ? 'px-2 min-w-[50px] md:min-w-[60px] text-[8px] md:text-[10px]' : 'w-7 md:w-10 text-xs'} 
                    h-10 md:h-12 rounded md:rounded-lg font-bold flex items-center justify-center transition-all active:scale-90 bg-zinc-900 border border-white/5 text-white
                  `}
                >
                  {key === 'BACKSPACE' ? <Delete size={14} /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-4">
      <div className="flex justify-between items-center w-full mb-8 px-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className="text-copper-light" />
          <h2 className="font-serif text-2xl text-white italic">Secret Termo</h2>
        </div>
        <button onClick={() => setIsHelpOpen(true)} className="text-gray-500 hover:text-white"><HelpCircle size={24}/></button>
      </div>

      <div className="grid grid-rows-6 gap-2 mb-4">
        {[...Array(MAX_ATTEMPTS)].map((_, r) => {
          const guess = guesses[r] || (r === guesses.length ? currentGuess : '');
          const isSubmitted = r < guesses.length;
          return (
            <div key={r} className="flex gap-1.5 md:gap-2">
              {[...Array(WORD_LENGTH)].map((_, c) => (
                <div key={c} className={`w-10 h-10 md:w-14 md:h-14 border-2 rounded-lg md:rounded-xl flex items-center justify-center font-black text-lg md:text-2xl transition-all duration-500 ${isSubmitted ? getStatusColor(getLetterStatus(guess, c)) : guess[c] ? 'border-white/30 bg-zinc-900' : 'border-white/5 bg-black/40'}`}>
                  {guess[c] || ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <Keyboard />
      {gameState !== 'playing' && (
        <button onClick={initGame} className="mt-8 bg-copper-gradient text-black px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
          <RefreshCw size={14} /> Novo Jogo
        </button>
      )}
    </div>
  );
};

export default SecretTermoGame;
