
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { generateContentIdeas } from '../services/geminiService';
import { ContentIdea } from '../types';
import { Plus, Sparkles, LayoutGrid, List, CalendarPlus } from 'lucide-react';

export const ContentEngine: React.FC = () => {
  const { brands, activeBrandId, contentPillars, contentIdeas, addContentIdeas, addContentPost, updateContentIdeaStatus, identities } = useAppStore();
  const [loading, setLoading] = useState(false);
  const currentIdentity = identities.find(i => i.brand_id === activeBrandId);
  
  // Filter logic
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  
  const activeBrand = brands.find(b => b.id === activeBrandId);
  if (!activeBrand) return <div>Select brand</div>;

  const filteredIdeas = selectedPillar === 'all' 
    ? contentIdeas 
    : contentIdeas.filter(i => i.pillar_id === selectedPillar);

  const handleGenerate = async () => {
    const pillarToUse = selectedPillar !== 'all' 
        ? contentPillars.find(p => p.id === selectedPillar) 
        : contentPillars[0];
    
    if (!pillarToUse) return alert("Select a pillar first");

    setLoading(true);
    try {
        const rawIdeas = await generateContentIdeas(activeBrand, pillarToUse.name, "LinkedIn");
        
        const newIdeas: ContentIdea[] = rawIdeas.map(r => ({
            id: crypto.randomUUID(),
            brand_id: activeBrand.id,
            pillar_id: pillarToUse.id,
            platform: 'LinkedIn',
            format: 'Post',
            hook: r.hook,
            outline: r.outline,
            status: 'idea',
            ai_prompt_used: 'Auto-generated'
        }));

        addContentIdeas(newIdeas);
    } catch (e) {
        alert("Generation failed");
    } finally {
        setLoading(false);
    }
  };

  const handleAddToCalendar = (idea: ContentIdea) => {
      // Simple mock implementation: schedules for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      addContentPost({
          id: crypto.randomUUID(),
          brand_id: idea.brand_id,
          content_idea_id: idea.id,
          platform: idea.platform,
          caption: idea.outline, // Use outline as draft caption
          media_urls: [],
          scheduled_for: tomorrow.toISOString(),
          metrics_views: 0,
          metrics_likes: 0,
          metrics_comments: 0,
          metrics_saves: 0,
          metrics_shares: 0
      });
      
      updateContentIdeaStatus(idea.id, 'approved');
      alert("Added draft to calendar!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
             <div>
                 <h1 className="text-3xl font-bold">Content Engine</h1>
                 <p className="opacity-60">From raw ideas to polished posts.</p>
             </div>
             <div className="flex items-center gap-4">
                 {currentIdentity?.logo_primary_url && (
                    <img src={currentIdentity.logo_primary_url} alt="Logo" className="h-10 w-auto opacity-80" />
                 )}
                 <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-black text-white px-6 py-3 rounded-lg shadow-md hover:opacity-80 flex items-center gap-2 font-medium transition-opacity"
                 >
                     {loading ? <Sparkles className="animate-spin" /> : <Sparkles />}
                     Generate 5 Ideas
                 </button>
             </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button 
                onClick={() => setSelectedPillar('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedPillar === 'all' ? 'bg-black text-white' : 'bg-white border border-black/10 text-black/70 hover:bg-black/5'}`}
            >
                All Ideas
            </button>
            {contentPillars.map(p => (
                 <button 
                    key={p.id}
                    onClick={() => setSelectedPillar(p.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedPillar === p.id ? 'bg-black text-white' : 'bg-white border border-black/10 text-black/70 hover:bg-black/5'}`}
                >
                    {p.name}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.length === 0 ? (
                <div className="col-span-full text-center py-20 opacity-40 border-2 border-dashed border-black/10 rounded-xl">
                    No ideas yet. Click generate!
                </div>
            ) : (
                filteredIdeas.map(idea => (
                    <div key={idea.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-black/5 flex flex-col hover:bg-white transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                            <span className="inline-block px-2 py-1 bg-black/5 text-black/60 text-xs rounded font-medium uppercase">
                                {contentPillars.find(p => p.id === idea.pillar_id)?.name || 'General'}
                            </span>
                            <span className={`text-xs font-medium ${idea.status === 'approved' ? 'text-green-600' : 'opacity-50'}`}>
                                {idea.status}
                            </span>
                        </div>
                        
                        <h3 className="font-bold mb-2 leading-tight">{idea.hook}</h3>
                        <p className="text-sm opacity-60 flex-1 line-clamp-4">{idea.outline}</p>
                        
                        <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                             <span className="text-xs opacity-60">{idea.platform}</span>
                             <button 
                                onClick={() => handleAddToCalendar(idea)}
                                className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Add to Calendar"
                            >
                                 <CalendarPlus size={18} />
                             </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
