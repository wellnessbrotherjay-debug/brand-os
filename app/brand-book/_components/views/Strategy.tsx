
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { regenerateStrategySection } from '../services/geminiService';
import { StrategySectionType } from '../types';
import { RefreshCw, Wand2 } from 'lucide-react';

export const Strategy: React.FC = () => {
  const { brands, activeBrandId, strategySections, updateStrategySection, addStrategySections, identities } = useAppStore();
  const [activeTab, setActiveTab] = useState<StrategySectionType>(StrategySectionType.Purpose);
  const [loading, setLoading] = useState(false);

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);
  
  // Use brand primary color for highlights if available, else default
  const highlightColor = activeIdentity?.color_accent_hex || '#4f46e5';

  if (!activeBrand) return <div>Select a brand</div>;

  // Get current section data or default to empty
  const currentSection = strategySections.find(s => s.brand_id === activeBrandId && s.section_type === activeTab);
  const content = currentSection?.content || "";

  const handleRegenerate = async (instruction: string) => {
    setLoading(true);
    try {
      const newContent = await regenerateStrategySection(
        activeBrand,
        activeTab,
        content,
        instruction
      );
      
      if (currentSection) {
        updateStrategySection(currentSection.id, newContent);
      } else {
        addStrategySections([{
            id: crypto.randomUUID(),
            brand_id: activeBrand.id,
            section_type: activeTab,
            content: newContent,
            source: 'ai',
            updated_at: new Date().toISOString()
        }]);
      }
    } catch (e) {
      alert("Error generating content");
    } finally {
      setLoading(false);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (currentSection) {
          updateStrategySection(currentSection.id, e.target.value);
      } else {
           addStrategySections([{
            id: crypto.randomUUID(),
            brand_id: activeBrand.id,
            section_type: activeTab,
            content: e.target.value,
            source: 'manual',
            updated_at: new Date().toISOString()
        }]);
      }
  }

  return (
    <div className="flex h-full">
      {/* Tabs Sidebar */}
      <div className="w-64 border-r border-black/10 overflow-y-auto py-6 bg-white/40 backdrop-blur-sm">
        <h2 className="px-6 text-xs font-bold uppercase tracking-wider mb-4 opacity-60">Strategy Sections</h2>
        <nav className="space-y-1">
          {Object.values(StrategySectionType).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 border-l-4 ${
                activeTab === type
                  ? 'bg-black/5 font-semibold'
                  : 'border-transparent opacity-60 hover:bg-black/5 hover:opacity-100'
              }`}
              style={{ 
                  borderColor: activeTab === type ? highlightColor : 'transparent',
                  color: 'inherit'
              }}
            >
              {type}
            </button>
          ))}
        </nav>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-serif-brand tracking-tight">{activeTab}</h1>
            <div className="flex items-center gap-4">
                 {activeIdentity?.logo_primary_url && (
                    <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-10 w-auto opacity-80 object-contain" />
                 )}
                <button 
                    onClick={() => handleRegenerate("Make it shorter and punchier.")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg hover:bg-black/5 text-sm font-medium shadow-sm transition-all opacity-80 hover:opacity-100"
                    style={{ color: 'inherit' }}
                >
                    <Wand2 size={16} />
                    Shorten
                </button>
                <button 
                    onClick={() => handleRegenerate("Rewrite specifically for this brand.")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md text-sm font-medium transition-all opacity-90 hover:opacity-100 hover:shadow-lg"
                    style={{ backgroundColor: highlightColor }}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Regenerate with AI
                </button>
            </div>
          </div>

          {/* Main Content Area - High Contrast White/Black */}
          <div className="bg-white rounded-xl shadow-lg border border-black/10 overflow-hidden ring-1 ring-black/5">
            <textarea
              className="w-full h-[500px] p-8 resize-none outline-none text-black text-lg leading-relaxed font-serif-brand bg-white"
              placeholder={`Write your ${activeTab} here...`}
              value={content}
              onChange={handleManualChange}
              style={{ 
                  minHeight: '400px',
                  fontSize: '1.125rem',
                  lineHeight: '1.8'
              }}
            />
            <div className="bg-black/5 px-6 py-3 text-xs border-t border-black/10 flex justify-between font-medium opacity-60">
               <span>{content.length} characters</span>
               <span className="uppercase tracking-wide">{currentSection?.source === 'ai' ? 'Generated by AI' : 'Manual Entry'}</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white/50 border border-black/10 rounded-lg text-sm flex items-start gap-3 backdrop-blur-sm">
             <div className="mt-1 opacity-70"><Wand2 size={16} /></div>
             <div className="opacity-80">
                <strong className="block mb-1 opacity-100">Strategic Insight</strong>
                Your {activeTab} informs all content creation. Keep it updated to ensure your content engine stays aligned with your brand soul.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
