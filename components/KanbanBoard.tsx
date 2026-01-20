
import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Task, TaskStatus, UrgencyLevel, ViewProps } from '../types';
import { Plus, Calendar, X, Check, GripVertical, Flag, Loader2, Trash2, History, LayoutDashboard, AlertTriangle, WifiOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface KanbanBoardProps extends ViewProps {}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ isEditable }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Form State
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Geral',
    deadline: '',
    urgency: 'Medium' as UrgencyLevel,
    assigned_to: 'Eu',
    status: 'TODO' as TaskStatus
  });

  useEffect(() => {
    fetchTasks();
    
    // Auto-refresh a cada minuto
    const interval = setInterval(() => {
        if (isSupabaseConfigured()) {
            fetchTasks(true); // silent refresh
        }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at');
        if (error) throw error;
        if (data) setTasks(data);
      } else {
        // Fallback: Carrega do LocalStorage se não houver backend
        const localData = localStorage.getItem('atlas_tasks');
        if (localData) {
            setTasks(JSON.parse(localData));
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar tarefas:", err);
      if (!silent) setFetchError("Falha ao sincronizar. Usando modo offline.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    // Prepara payload corrigindo campos vazios para null (Postgres não aceita string vazia em datas)
    const taskPayload = {
        ...newTask,
        deadline: newTask.deadline ? newTask.deadline : null
    };

    // Optimistic Update (Atualiza a tela antes do banco)
    const tempId = Date.now();
    const mockTask: Task = { id: tempId, ...newTask, created_at: new Date().toISOString() };
    const updatedTasks = [...tasks, mockTask];
    setTasks(updatedTasks);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('tasks').insert([taskPayload]).select();
        if (error) throw error;
        
        // Atualiza com o ID real do banco
        if (data) {
            setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t));
        }
      } catch (err) {
        console.error("Erro ao salvar tarefa remota:", err);
        alert("Erro ao salvar no banco. Verifique sua conexão.");
      }
    } else {
        // Salva no LocalStorage
        localStorage.setItem('atlas_tasks', JSON.stringify(updatedTasks));
    }

    setIsModalOpen(false);
    setNewTask({ title: '', category: 'Geral', deadline: '', urgency: 'Medium', assigned_to: 'Eu', status: 'TODO' });
  };

  const handleDeleteTask = async (id: number) => {
    if (!isEditable) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    setIsConfirmDeleteOpen(null);

    if (isSupabaseConfigured()) {
        try {
            await supabase.from('tasks').delete().eq('id', id);
        } catch (err) {
            console.error("Erro ao deletar tarefa remota:", err);
        }
    } else {
        localStorage.setItem('atlas_tasks', JSON.stringify(updatedTasks));
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!isEditable) return;

    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    const taskId = Number(draggableId);
    const now = new Date().toISOString();

    // Atualiza estado local
    const updatedTasks = tasks.map((t) => 
        t.id === taskId 
            ? { ...t, status: newStatus, completed_at: newStatus === 'DONE' ? now : undefined } 
            : t
    );
    setTasks(updatedTasks);

    if (isSupabaseConfigured()) {
        try {
            const updateData: any = { status: newStatus };
            if (newStatus === 'DONE') updateData.completed_at = now;
            else updateData.completed_at = null;
            await supabase.from('tasks').update(updateData).eq('id', taskId);
        } catch (err) {
            console.error("Erro ao atualizar status remoto:", err);
        }
    } else {
        localStorage.setItem('atlas_tasks', JSON.stringify(updatedTasks));
    }
  };

  const ARCHIVE_TIME_MS = 10 * 60 * 1000;

  const { activeTasks, archivedTasks } = useMemo(() => {
    const now = new Date().getTime();
    const active: Task[] = [];
    const archived: Task[] = [];

    tasks.forEach(task => {
        if (task.status === 'DONE' && task.completed_at) {
            const completedTime = new Date(task.completed_at).getTime();
            if (now - completedTime > ARCHIVE_TIME_MS) {
                archived.push(task);
            } else {
                active.push(task);
            }
        } else {
            active.push(task);
        }
    });

    return { activeTasks: active, archivedTasks: archived };
  }, [tasks]);

  const columns: { id: TaskStatus; label: string; }[] = [
    { id: 'TODO', label: 'A Fazer' },
    { id: 'DOING', label: 'Em Andamento' },
    { id: 'REVIEW', label: 'Revisão' },
    { id: 'DONE', label: 'Concluído' },
  ];

  const getUrgencyStyles = (urgency?: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'High': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      case 'Medium': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
      case 'Low': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
      default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    }
  };

  const getCategoryColor = (category: string) => {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-indigo-500'];
      const index = Math.abs(category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
      return colors[index];
  };

  return (
    <div className="h-full flex flex-col relative pb-10">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h2 className="font-serif text-4xl text-white mb-2 tracking-tight italic">
                {showHistory ? 'Histórico' : 'Quadro Executivo'}
           </h2>
           <p className="text-gray-400 font-light max-w-md">
                {showHistory 
                    ? 'Registro de missões finalizadas com sucesso.' 
                    : 'Acompanhamento tático das operações Atlas 2026.'}
           </p>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 border transition-all duration-300 ${
                    showHistory 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
            >
                {showHistory ? <LayoutDashboard size={18} /> : <History size={18} />}
                {showHistory ? 'Voltar' : 'Histórico'}
            </button>

            {!showHistory && isEditable && (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-copper-gradient text-black px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,131,106,0.3)] hover:shadow-[0_0_30px_rgba(197,131,106,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
                >
                    <Plus size={20} /> Nova Tarefa
                </button>
            )}
        </div>
      </div>

      {fetchError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 text-red-400 text-sm font-medium">
                  <WifiOff size={18} />
                  {fetchError}
              </div>
              <button onClick={() => fetchTasks(false)} className="text-[10px] uppercase font-bold tracking-widest text-white bg-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/40 transition">Tentar Novamente</button>
          </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 className="w-12 h-12 text-copper-DEFAULT animate-spin" />
            <p className="text-gray-500 font-serif mt-4 text-sm animate-pulse tracking-wide">Sincronizando tarefas...</p>
        </div>
      ) : showHistory ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar animate-in fade-in duration-500">
            {archivedTasks.length === 0 ? (
                <div className="bg-[#121212] border border-dashed border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center text-gray-600">
                    <History size={48} className="mb-4 opacity-20" />
                    <p className="font-serif italic text-xl">Nenhuma tarefa arquivada.</p>
                </div>
            ) : (
                archivedTasks.map((task) => (
                    <div key={task.id} className="bg-[#121212] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-copper-DEFAULT/30 transition">
                        <div className="flex items-center gap-6">
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                                <Check size={20} />
                            </div>
                            <div>
                                <h4 className="text-gray-100 font-medium text-lg">{task.title}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{task.category}</span>
                                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                    <span className="text-xs text-gray-600">Concluído em: {new Date(task.completed_at!).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                        {isEditable && (
                            <button 
                                onClick={() => setIsConfirmDeleteOpen(task.id)}
                                className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 overflow-x-auto pb-6">
              <div className="flex gap-8 h-full min-w-max">
                {columns.map((col) => (
                  <div key={col.id} className="w-80 flex flex-col bg-city-panel/40 backdrop-blur-md rounded-2xl border border-white/5">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                       <h3 className="font-serif text-xl text-gray-200">{col.label}</h3>
                       <span className="text-[10px] font-bold text-copper-light bg-copper-light/10 px-2 py-1 rounded border border-copper-light/20 uppercase tracking-tighter">
                          {activeTasks.filter((t) => t.status === col.id).length} itens
                       </span>
                    </div>
                    
                    <Droppable droppableId={col.id} isDropDisabled={!isEditable}>
                      {(provided, snapshot) => (
                          <div 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`flex-1 p-4 space-y-4 overflow-y-auto transition-all duration-300 rounded-b-2xl min-h-[300px] ${
                                  snapshot.isDraggingOver ? 'bg-copper-dark/5 shadow-inner' : 'bg-transparent'
                              }`}
                          >
                              {activeTasks
                              .filter((task) => task.status === col.id)
                              .map((task, index) => {
                                  const urgencyStyles = getUrgencyStyles(task.urgency);
                                  return (
                                  <Draggable key={task.id} draggableId={task.id.toString()} index={index} isDragDisabled={!isEditable}>
                                      {(provided, snapshot) => (
                                          <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`
                                                  bg-[#121212] p-5 rounded-xl border border-white/5 shadow-lg group relative overflow-hidden transition-all duration-200
                                                  ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 ring-2 ring-copper-DEFAULT/50 z-50 bg-[#18181b] cursor-grabbing' : isEditable ? 'cursor-grab hover:border-white/20' : 'cursor-default'}
                                              `}
                                          >
                                              <div className="absolute top-0 left-0 w-[2px] h-full bg-copper-DEFAULT opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                              
                                              {isEditable && (
                                                  <button 
                                                    onClick={() => setIsConfirmDeleteOpen(task.id)}
                                                    className="absolute top-3 right-3 p-1.5 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-md"
                                                  >
                                                      <Trash2 size={14} />
                                                  </button>
                                              )}

                                              <div className="flex justify-between items-start mb-4">
                                                  <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm text-white ${getCategoryColor(task.category)} bg-opacity-30 text-opacity-90`}>
                                                      {task.category}
                                                  </span>
                                                  {isEditable && <GripVertical size={16} className="text-gray-700 opacity-20 group-hover:opacity-100 transition-opacity pr-6" />}
                                              </div>
                                              <h4 className="text-gray-100 font-medium mb-4 leading-relaxed text-[15px]">{task.title}</h4>
                                              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                                  <div className="flex items-center gap-3">
                                                      {task.deadline && (
                                                          <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase">
                                                              <Calendar size={12} className="text-copper-light" />
                                                              <span>{new Date(task.deadline).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                                          </div>
                                                      )}
                                                      {task.urgency && (
                                                           <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${urgencyStyles.bg} ${urgencyStyles.color} border ${urgencyStyles.border}`}>
                                                              {task.urgency}
                                                           </div>
                                                      )}
                                                  </div>
                                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-copper-dark to-black border border-white/10 flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                                                      {task.assigned_to.charAt(0)}
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                  </Draggable>
                                  );
                              })}
                              {provided.placeholder}
                          </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>
        </DragDropContext>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-[#121212] rounded-2xl border border-white/10 w-full max-w-md relative z-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-serif text-xl text-white italic">Nova Tarefa</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Título da Tarefa</label>
                        <input required type="text" className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT focus:ring-1 focus:ring-copper-DEFAULT outline-none transition placeholder-gray-700" placeholder="Ex: Contratar Fotógrafo" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Categoria</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none appearance-none cursor-pointer hover:bg-[#151515] transition" value={newTask.category} onChange={(e) => setNewTask({...newTask, category: e.target.value})}>
                                <option value="Geral">Geral</option>
                                <option value="Financeiro">Financeiro</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Jurídico">Jurídico</option>
                                <option value="Logística">Logística</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Responsável</label>
                             <input type="text" className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none" value={newTask.assigned_to} onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Prazo</label>
                            <input type="date" className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none [color-scheme:dark]" value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-copper-light uppercase tracking-wider mb-2">Urgência</label>
                            <select className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:border-copper-DEFAULT outline-none cursor-pointer" value={newTask.urgency} onChange={(e) => setNewTask({...newTask, urgency: e.target.value as UrgencyLevel})}>
                                <option value="Low">Baixa</option>
                                <option value="Medium">Média</option>
                                <option value="High">Alta</option>
                                <option value="Critical">Crítica</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-lg transition">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-copper-gradient text-black font-bold rounded-lg shadow-lg hover:shadow-copper-DEFAULT/20 transition flex justify-center items-center gap-2 transform active:scale-95"><Check size={18} /> Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isConfirmDeleteOpen !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsConfirmDeleteOpen(null)}></div>
              <div className="bg-[#18181b] rounded-2xl border border-red-500/20 w-full max-w-sm relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="font-serif text-2xl text-white mb-2">Excluir Tarefa?</h3>
                      <p className="text-gray-400 text-sm mb-8 leading-relaxed">Esta ação removerá permanentemente a tarefa do sistema.</p>
                      <div className="flex gap-3">
                          <button onClick={() => setIsConfirmDeleteOpen(null)} className="flex-1 py-3 text-gray-400 font-semibold hover:bg-white/5 rounded-xl transition">Manter</button>
                          <button onClick={() => handleDeleteTask(isConfirmDeleteOpen)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition transform active:scale-95">Excluir</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default KanbanBoard;
