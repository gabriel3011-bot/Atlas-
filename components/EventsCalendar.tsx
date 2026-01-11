
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { AppEvent } from '../types';
import { 
  MapPin, Clock, Calendar as CalendarIcon, Plus, X, 
  Users, Trash2, AlertTriangle, Check, Loader2, 
  ChevronRight, Filter, History, Sparkles 
} from 'lucide-react';

type SubTab = 'UPCOMING' | 'PAST';

const EventsCalendar: React.FC = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [activeTab, setActiveTab] = useState<SubTab>('UPCOMING');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AppEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    location: '',
    capacity: 0,
    category: 'Festa',
    description: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
        
        if (error) throw error;
        if (data) setEvents(data);
      } else {
        // Mock data se não houver Supabase
        const mock: AppEvent[] = [
          { id: 1, title: 'Gala de Inverno', event_date: '2025-12-20T22:00:00', location: 'Hotel Unique', capacity: 500, category: 'Festa', description: 'O evento principal do ano.', status: 'Confirmado' },
          { id: 2, title: 'Vistoria Técnica', event_date: '2023-05-10T14:00:00', location: 'Espaço JK', capacity: 20, category: 'Vistoria', description: 'Checagem de som e luz.', status: 'Realizado' },
          { id: 3, title: 'Reunião de Orçamento', event_date: '2025-06-15T19:00:00', location: 'Sede IBMEC', capacity: 30, category: 'Reunião', description: 'Definição das próximas taxas.', status: 'Pendente' },
        ];
        setEvents(mock);
      }
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return activeTab === 'UPCOMING' ? eventDate >= now : eventDate < now;
    }).sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return activeTab === 'UPCOMING' ? dateA - dateB : dateB - dateA;
    });
  }, [events, activeTab]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('events')
          .insert([formData])
          .select();
        
        if (error) throw error;
        if (data) setEvents([...events, data[0]]);
      } else {
        const newEv = { ...formData, id: Math.random() };
        setEvents([...events, newEv as any]);
      }
      setIsAddModalOpen(false);
      setFormData({ title: '', event_date: '', location: '', capacity: 0, category: 'Festa', description: '' });
    } catch (err) {
      alert("Erro ao criar evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('events').delete().eq('id', eventToDelete.id);
      }
      setEvents(events.filter(e => e.id !== eventToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert("Erro ao excluir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const hour = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return { day, month, time: `${hour}:${min}` };
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-serif text-4xl text-white italic tracking-tight mb-2">Eventos & Experiências</h2>
          <p className="text-gray-500 font-light">Gestão do calendário social e institucional da Atlas.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-copper-gradient text-black px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_40px_rgba(197,131,106,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} /> Novo Evento
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-white/5 space-x-10">
        <button 
          onClick={() => setActiveTab('UPCOMING')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'UPCOMING' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          Próximos Eventos
          {activeTab === 'UPCOMING' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('PAST')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'PAST' ? 'text-copper-light' : 'text-gray-600 hover:text-gray-400'}`}
        >
          Histórico
          {activeTab === 'PAST' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-copper-gradient shadow-[0_0_10px_#C5836A]"></div>}
        </button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-copper-DEFAULT mb-4" size={40} />
          <span className="text-gray-500 font-serif italic">Consultando agenda...</span>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filteredEvents.map((event) => {
            const { day, month, time } = formatDate(event.event_date);
            return (
              <div 
                key={event.id}
                className="group relative bg-[#0d0d0d] rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-copper-DEFAULT/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[420px]"
              >
                {/* Visual Glass Effect Top */}
                <div className="h-32 bg-gradient-to-br from-copper-dark/20 to-transparent relative p-6">
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-copper-light">
                      {event.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="bg-city-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-center min-w-[70px] shadow-2xl">
                        <span className="block text-2xl font-serif font-bold text-white leading-none">{day}</span>
                        <span className="block text-[10px] font-black text-copper-DEFAULT mt-1">{month}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-white font-medium text-lg leading-tight group-hover:text-copper-light transition-colors">{event.title}</span>
                        <span className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Clock size={12} className="text-copper-dark" /> {time}h
                        </span>
                     </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-gray-400 text-sm">
                        <MapPin size={16} className="text-copper-DEFAULT mt-0.5 shrink-0" />
                        <span className="leading-snug">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <Users size={16} className="text-copper-DEFAULT shrink-0" />
                        <span>Capacidade: <strong className="text-white">{event.capacity || '--'}</strong> convidados</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm line-clamp-3 font-light leading-relaxed italic">
                      "{event.description || 'Nenhuma descrição detalhada para este evento.'}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-zinc-900 border border-black flex items-center justify-center text-[10px] text-gray-500 font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-copper-DEFAULT/10 border border-copper-DEFAULT/20 flex items-center justify-center text-[8px] text-copper-light font-bold">
                        +12
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setEventToDelete(event);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Hover Glow Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-copper-DEFAULT/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center py-40 bg-white/[0.01]">
          <History size={60} className="text-gray-800 mb-6" />
          <h3 className="text-2xl font-serif text-gray-600 italic">Nenhum registro encontrado</h3>
          <p className="text-gray-700 max-w-xs text-center mt-2">
            A agenda está livre por enquanto ou não há histórico disponível para este filtro.
          </p>
        </div>
      )}

      {/* Modal Novo Evento */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-copper-DEFAULT/10 rounded-xl">
                  <Sparkles className="text-copper-light" size={24} />
                </div>
                <h3 className="font-serif text-2xl text-white italic">Planejar Novo Evento</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>

            <form onSubmit={handleAddEvent} className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Título da Experiência</label>
                <input required type="text" className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none" placeholder="Ex: Baile de Máscaras IBMEC" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Data e Hora</label>
                <input required type="datetime-local" className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none [color-scheme:dark]" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Categoria</label>
                <select className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Festa">Festa</option>
                  <option value="Reunião">Reunião</option>
                  <option value="Cerimônia">Cerimônia</option>
                  <option value="Vistoria">Vistoria</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Localização</label>
                <input required type="text" className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none" placeholder="Nome do local" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Capacidade Máxima</label>
                <input required type="number" className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none" placeholder="0" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})} />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-copper-light uppercase tracking-widest block mb-2">Descrição (Opcional)</label>
                <textarea rows={3} className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-copper-DEFAULT outline-none resize-none" placeholder="Detalhes importantes do evento..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-white/5 rounded-xl transition">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-copper-gradient text-black font-black rounded-xl shadow-xl flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Confirmar Evento</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deletar Evento */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl w-full max-w-md relative z-10 p-8 shadow-2xl text-center">
             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <AlertTriangle className="text-red-500" size={40} />
             </div>
             <h3 className="font-serif text-2xl text-white italic mb-2">Cancelar Evento?</h3>
             <p className="text-gray-500 text-sm mb-8 leading-relaxed">
               Você está prestes a remover o evento <strong className="text-white">"{eventToDelete?.title}"</strong> da agenda Atlas. Esta ação não pode ser revertida.
             </p>
             <div className="flex gap-4">
               <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-white/5 rounded-xl transition">Manter</button>
               <button 
                onClick={handleDeleteEvent} 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 transition-all flex justify-center items-center gap-2"
               >
                 {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Excluir'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
