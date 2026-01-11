import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { MarketingPost } from '../types';
import { Instagram, Heart, MessageCircle, ArrowRight, Loader2, Check, Lock, X } from 'lucide-react';

const MarketingGrid: React.FC = () => {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
     // Default aesthetic posts (before connection)
     const initialPosts: MarketingPost[] = [
        { id: 1, image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', caption: 'Planejamento 2026 iniciado. #Atlas', scheduled_date: '2024-01-15', platform: 'Instagram', status: 'idea', likes_count: 0, comments_count: 0 },
      ];
      setPosts(initialPosts);
  }, []);

  const handleOpenConnect = () => {
    setIsLoginModalOpen(true);
  };

  const performMockLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsAuthenticating(true);
      
      // Simulate OAuth redirect/processing time
      setTimeout(() => {
          setIsAuthenticating(false);
          setIsLoginModalOpen(false);
          setIsConnected(true);
          
          // Populate with "Live" Feed Mock Data after connection
          const liveFeed: MarketingPost[] = [
            { id: 101, image_url: 'https://images.unsplash.com/photo-1519671482502-9759101d4561?auto=format&fit=crop&w=400&q=80', caption: 'Contagem regressiva: 2 anos! 🎓', scheduled_date: '2024-02-01', platform: 'Instagram', status: 'posted', likes_count: 1240, comments_count: 56 },
            { id: 102, image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80', caption: 'Nossa comissão reunida para o primeiro planejamento.', scheduled_date: '2024-02-10', platform: 'Instagram', status: 'posted', likes_count: 890, comments_count: 32 },
            { id: 103, image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=400&q=80', caption: 'Spoiler: O local vai ser incrível. 🏰', scheduled_date: '2024-03-05', platform: 'Instagram', status: 'posted', likes_count: 2100, comments_count: 145 },
            { id: 104, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', caption: 'Moodboard da festa: Elegância e Modernidade.', scheduled_date: '2024-03-15', platform: 'Instagram', status: 'scheduled', likes_count: 0, comments_count: 0 },
            { id: 105, image_url: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=400&q=80', caption: 'Votação para o DJ aberta nos stories!', scheduled_date: '2024-03-20', platform: 'Instagram', status: 'scheduled', likes_count: 0, comments_count: 0 },
            { id: 106, image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', caption: 'Save the date oficial.', scheduled_date: '2024-04-01', platform: 'Instagram', status: 'idea', likes_count: 0, comments_count: 0 },
          ];
          setPosts(liveFeed);
      }, 2000);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="font-serif text-3xl text-white mb-2">Feed Social</h2>
            <p className="text-gray-400 font-light">
                {isConnected ? 'Sincronizado com @atlas.2026' : 'Planeje a identidade visual da turma.'}
            </p>
         </div>
         
         <div className="flex items-center gap-4">
             {!isConnected ? (
                <button 
                    onClick={handleOpenConnect}
                    className="group relative border border-copper-DEFAULT text-copper-light px-6 py-2.5 rounded-full flex items-center gap-3 text-sm font-medium hover:bg-copper-DEFAULT hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(197,131,106,0.1)] hover:shadow-[0_0_25px_rgba(197,131,106,0.4)] active:scale-95"
                >
                    <Instagram size={18} /> 
                    Conectar Instagram
                </button>
             ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium px-4 py-2 bg-green-900/10 border border-green-500/20 rounded-full animate-in fade-in duration-500">
                    <Check size={14} strokeWidth={3} />
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Conectado
                </div>
             )}
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
        {posts.map((post) => (
            <div key={post.id} className="group relative aspect-square bg-[#121212] cursor-pointer overflow-hidden rounded-sm border border-white/5 hover:border-copper-DEFAULT/30 shadow-2xl transition-all hover:-translate-y-1 animate-in fade-in duration-700 fill-mode-backwards" style={{ animationDelay: `${post.id * 50}ms` }}>
                {/* Image */}
                <img src={post.image_url} alt="Post" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 grayscale group-hover:grayscale-0" />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="flex justify-between items-end mb-4">
                        <div className="text-white w-full">
                             {post.status === 'posted' && (
                                <div className="flex gap-4 mb-2">
                                    <span className="flex items-center gap-1 text-xs font-bold"><Heart size={14} className="fill-white"/> {post.likes_count || 0}</span>
                                    <span className="flex items-center gap-1 text-xs font-bold"><MessageCircle size={14} className="fill-white"/> {post.comments_count || 0}</span>
                                </div>
                             )}
                             <p className="text-xs font-medium text-gray-200 line-clamp-2 drop-shadow-md">{post.caption}</p>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/20 flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-300">
                        <span>{new Date(post.scheduled_date).toLocaleDateString('pt-BR')}</span>
                        <span className={`px-2 py-0.5 border rounded-full ${
                            post.status === 'posted' ? 'border-green-500 text-green-400 bg-green-500/10' : 
                            post.status === 'scheduled' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                            'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                        }`}>
                            {post.status === 'posted' ? 'Postado' : post.status === 'scheduled' ? 'Agendado' : 'Ideia'}
                        </span>
                    </div>
                </div>
            </div>
        ))}
        
        {/* Add New Placeholder */}
        <button className="aspect-square bg-[#121212] border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-copper-light hover:border-copper-DEFAULT/50 transition-all group rounded-sm">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-copper-DEFAULT/50 transition-all bg-[#0a0a0a]">
                <ArrowRight size={24} />
            </div>
            <span className="font-serif italic text-lg">Criar Post</span>
        </button>
      </div>

      {/* Mock Login Modal */}
      {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={() => setIsLoginModalOpen(false)}></div>
              <div className="bg-white rounded-lg w-full max-w-sm relative z-10 overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-8 flex flex-col items-center">
                       <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                       
                       {/* Instagram Logo Simulation */}
                       <h3 className="font-serif italic text-3xl mb-8 mt-4 text-black">Instagram</h3>

                       <form onSubmit={performMockLogin} className="w-full space-y-3">
                           <input type="text" disabled className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm outline-none focus:border-gray-400 text-gray-800" value="comissao.atlas" readOnly />
                           <input type="password" placeholder="Senha" className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm outline-none focus:border-gray-400 text-gray-800" required />
                           
                           <button 
                            type="submit" 
                            disabled={isAuthenticating}
                            className="w-full bg-[#0095f6] text-white font-bold py-1.5 rounded text-sm hover:bg-[#1877f2] transition flex justify-center items-center"
                           >
                               {isAuthenticating ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                           </button>
                       </form>

                       <div className="w-full flex items-center gap-4 my-6">
                           <div className="h-px bg-gray-300 flex-1"></div>
                           <span className="text-xs font-bold text-gray-400 uppercase">OU</span>
                           <div className="h-px bg-gray-300 flex-1"></div>
                       </div>

                       <div className="text-center space-y-4">
                           <p className="text-[#385185] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
                               <span className="bg-[#385185] text-white rounded p-0.5"><Lock size={10}/></span> Entrar com o Facebook
                           </p>
                           <p className="text-xs text-[#00376b] cursor-pointer">Esqueceu a senha?</p>
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MarketingGrid;