
import React, { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, X, Loader2, CheckCircle } from 'lucide-react';
import { View } from '../types';

interface FeedbackWidgetProps {
  currentView: View;
  userEmail: string;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentView, userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('app_feedback').insert([{
          user_email: userEmail,
          type,
          message,
          view_context: currentView
        }]);
        if (error) throw error;
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setMessage('');
      }, 2000);
    } catch (err) {
      alert('Erro ao enviar feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150]">
      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase tracking-widest text-copper-light">Central de Feedback</span>
             <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition"><X size={16}/></button>
          </div>
          
          <div className="p-6">
            {success ? (
                <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in">
                    <CheckCircle className="text-green-500 mb-3" size={32} />
                    <span className="text-sm font-bold text-white">Feedback enviado!</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setType('bug')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${type === 'bug' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                            <Bug size={14}/> Bug
                        </button>
                        <button 
                            type="button"
                            onClick={() => setType('suggestion')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${type === 'suggestion' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                            <Lightbulb size={14}/> Sugestão
                        </button>
                    </div>

                    <textarea 
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-copper-DEFAULT outline-none resize-none"
                        rows={4}
                        placeholder={type === 'bug' ? 'O que parou de funcionar?' : 'Qual sua ideia de melhoria?'}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <div className="text-[9px] text-gray-600 flex justify-between italic">
                        <span>Página: {currentView}</span>
                        <span>User: {userEmail.split('@')[0]}</span>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="w-full bg-copper-gradient text-black font-bold py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Enviar</>}
                    </button>
                </form>
            )}
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${isOpen ? 'bg-white text-black' : 'bg-copper-gradient text-black'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default FeedbackWidget;
