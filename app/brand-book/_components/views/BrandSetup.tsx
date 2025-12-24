
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { generateBrandStrategy, analyzeBrandText } from '../services/geminiService';
import { Brand, BrandStrategySection, StrategySectionType } from '../types';
import { Loader2, Sparkles, FileText, Wand2 } from 'lucide-react';

export const BrandSetup: React.FC<{ setView: (v: any) => void }> = ({ setView }) => {
  const { addBrand, addStrategySections, updateIdentity, identities, brands, activeBrandId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [mode, setMode] = useState<'wizard' | 'import'>('wizard');
  const [step, setStep] = useState(1);
  const [importText, setImportText] = useState("");
  
  const [formData, setFormData] = useState<Omit<Brand, 'id'>>({
    name: '',
    tagline: '',
    niche: '',
    what_you_sell: '',
    who_you_help: '',
    transformation: '',
    difference: '',
    emotions: '',
    values: '',
    personality: '',
  });

  // Auto-seed logic: If we have an active brand, populate the form
  useEffect(() => {
      if (activeBrandId) {
          const activeBrand = brands.find(b => b.id === activeBrandId);
          if (activeBrand) {
              // Type cast to remove ID for form state
              const { id, ...rest } = activeBrand;
              setFormData(rest);
          }
      }
  }, [activeBrandId, brands]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processStrategyGeneration = async (brand: Brand, context?: string) => {
      setLoadingMessage("Generating strategy architecture...");
      const inputs = context ? [context] : [];
      const aiResponse = await generateBrandStrategy(brand, inputs);
      
      const sectionTypeMap: Record<string, StrategySectionType> = {
          'purpose': StrategySectionType.Purpose,
          'mission': StrategySectionType.Mission,
          'vision': StrategySectionType.Vision,
          'positioning': StrategySectionType.Positioning,
          'uvp': StrategySectionType.UVP,
          'brand_promise': StrategySectionType.BrandPromise,
          'brand_archetype': StrategySectionType.Archetype,
          'tone_of_voice': StrategySectionType.ToneOfVoice,
          'brand_story': StrategySectionType.BrandStory,
          'brand_manifesto': StrategySectionType.Manifesto,
          'campaign_framework': StrategySectionType.CampaignFramework,
          'messaging_pillars': StrategySectionType.MessagingPillars,
          'content_pillars': StrategySectionType.ContentPillars,
          'creative_direction': StrategySectionType.CreativeDirection,
          'ethics': StrategySectionType.Ethics,
      };
      
      const sections: BrandStrategySection[] = Object.entries(aiResponse).map(([key, content]) => {
        return {
            id: crypto.randomUUID(),
            brand_id: brand.id,
            section_type: sectionTypeMap[key] || StrategySectionType.Purpose,
            content: String(content),
            source: 'ai',
            updated_at: new Date().toISOString()
        };
      });

      addStrategySections(sections);
  }

  const handleWizardSubmit = async () => {
    if (!formData.name) return alert("Please enter a brand name.");
    
    setLoading(true);
    setLoadingMessage("Creating brand profile...");
    try {
      const newBrand: Brand = {
        id: crypto.randomUUID(),
        ...formData
      };
      addBrand(newBrand);
      await processStrategyGeneration(newBrand);
      setView('strategy');
    } catch (e) {
      console.error(e);
      alert("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async () => {
      if (!importText.trim()) return alert("Please paste your brand text.");

      setLoading(true);
      setLoadingMessage("Analyzing brand DNA...");
      
      try {
          // 1. Analyze Text
          const analysis = await analyzeBrandText([importText]);
          
          // 2. Create Brand
          const newBrand: Brand = {
              id: crypto.randomUUID(),
              ...analysis.brand
          };
          addBrand(newBrand);

          // 3. Update Identity if found (Extract colors/fonts/rules)
          if (analysis.identity) {
               const newIdentity = {
                   id: crypto.randomUUID(),
                   brand_id: newBrand.id,
                   logo_primary_url: '',
                   logo_secondary_url: '',
                   // Use extracted colors or defaults
                   color_primary_hex: analysis.identity.color_primary_hex || '#F4EDE5',
                   color_secondary_hex: analysis.identity.color_secondary_hex || '#D9C3B8',
                   color_accent_hex: analysis.identity.color_accent_hex || '#000000',
                   font_heading: analysis.identity.font_heading || 'Cormorant Garamond',
                   font_body: analysis.identity.font_body || 'Inter',
                   image_style: analysis.identity.image_style || '',
                   video_style: analysis.identity.video_style || '',
                   do_nots: analysis.identity.do_nots || '',
                   logo_rules: analysis.identity.logo_rules || '',
               };
               updateIdentity(newIdentity);
          }

          // 4. Generate Strategy
          await processStrategyGeneration(newBrand, importText);

          setView('strategy');

      } catch (e) {
          console.error(e);
          alert("Analysis failed. Please try again.");
      } finally {
          setLoading(false);
      }
  }

  // Shared classes
  const inputClass = "w-full border border-black/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-black/10 focus:border-black bg-white text-black placeholder-black/30 transition-all";
  const labelClass = "block text-sm font-medium mb-1 opacity-80";
  
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-black/5 flex items-center justify-center">
             <Wand2 size={24} className="opacity-80" />
        </div>
        <h1 className="text-3xl font-bold font-serif-brand">Brand Setup</h1>
        <p className="mt-2 opacity-60">Initialize your brand operating system.</p>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => setMode('wizard')}
            className={`p-4 rounded-xl border text-left transition-all ${mode === 'wizard' ? 'border-black/40 bg-black/5 ring-1 ring-black/10' : 'border-black/10 bg-white/50 hover:border-black/30'}`}
          >
              <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${mode === 'wizard' ? 'bg-white shadow-sm' : 'bg-black/5'}`}>
                      <Wand2 size={20} className="opacity-80" />
                  </div>
                  <span className="font-semibold">Guided Wizard</span>
              </div>
              <p className="text-xs opacity-60">Answer step-by-step questions to build your brand from scratch.</p>
          </button>

          <button 
            onClick={() => setMode('import')}
            className={`p-4 rounded-xl border text-left transition-all ${mode === 'import' ? 'border-black/40 bg-black/5 ring-1 ring-black/10' : 'border-black/10 bg-white/50 hover:border-black/30'}`}
          >
               <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${mode === 'import' ? 'bg-white shadow-sm' : 'bg-black/5'}`}>
                      <FileText size={20} className="opacity-80" />
                  </div>
                  <span className="font-semibold">Paste Brand Book</span>
              </div>
              <p className="text-xs opacity-60">Paste existing text (documents, brand books) and let AI extract everything.</p>
          </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-black/10 overflow-hidden">
        {/* IMPORT MODE */}
        {mode === 'import' && (
            <div className="p-8">
                <label className={labelClass}>Paste your brand text here</label>
                <p className="text-xs opacity-50 mb-4">Include as much detail as possible: mission, values, target audience, services, etc.</p>
                <textarea 
                    className={`${inputClass} h-96`}
                    placeholder="e.g. Brand Essence, Mission, Target Audience..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                />
                 <button 
                    onClick={handleImportSubmit} 
                    disabled={loading}
                    className="w-full mt-6 bg-black text-white py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {loading ? loadingMessage : "Analyze & Build Brand"}
                </button>
            </div>
        )}

        {/* WIZARD MODE */}
        {mode === 'wizard' && (
            <>
                <div className="flex border-b border-black/10">
                    <button onClick={() => setStep(1)} className={`flex-1 py-4 text-sm font-medium transition-colors ${step === 1 ? 'border-b-2 border-black font-bold' : 'opacity-50'}`}>1. The Basics</button>
                    <button onClick={() => setStep(2)} className={`flex-1 py-4 text-sm font-medium transition-colors ${step === 2 ? 'border-b-2 border-black font-bold' : 'opacity-50'}`}>2. The Customer</button>
                    <button onClick={() => setStep(3)} className={`flex-1 py-4 text-sm font-medium transition-colors ${step === 3 ? 'border-b-2 border-black font-bold' : 'opacity-50'}`}>3. The Vibe</button>
                </div>

                <div className="p-8 space-y-6">
                    {step === 1 && (
                        <>
                            <div>
                                <label className={labelClass}>Brand Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. Acme Co." />
                            </div>
                            <div>
                                <label className={labelClass}>Tagline</label>
                                <input name="tagline" value={formData.tagline} onChange={handleChange} className={inputClass} placeholder="Short catchy phrase" />
                            </div>
                            <div>
                                <label className={labelClass}>Niche / Category</label>
                                <input name="niche" value={formData.niche} onChange={handleChange} className={inputClass} placeholder="e.g. Organic Skincare for Teens" />
                            </div>
                            <div>
                                <label className={labelClass}>What do you sell?</label>
                                <textarea name="what_you_sell" value={formData.what_you_sell} onChange={handleChange} rows={3} className={inputClass} placeholder="Describe your core products or services" />
                            </div>
                            <button onClick={() => setStep(2)} className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition-colors font-medium">Next Step</button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <label className={labelClass}>Who do you help?</label>
                                <textarea name="who_you_help" value={formData.who_you_help} onChange={handleChange} rows={2} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>The Transformation</label>
                                <p className="text-xs opacity-50 mb-2">How is their life better after using your product?</p>
                                <textarea name="transformation" value={formData.transformation} onChange={handleChange} rows={2} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>What makes you different?</label>
                                <textarea name="difference" value={formData.difference} onChange={handleChange} rows={2} className={inputClass} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="w-1/3 bg-white border border-black/10 py-2 rounded-lg hover:bg-black/5">Back</button>
                                <button onClick={() => setStep(3)} className="w-2/3 bg-black text-white py-2 rounded-lg hover:opacity-90">Next Step</button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div>
                                <label className={labelClass}>Desired Emotions</label>
                                <input name="emotions" value={formData.emotions} onChange={handleChange} className={inputClass} placeholder="e.g. Safe, Excited, Powerful" />
                            </div>
                            <div>
                                <label className={labelClass}>Brand Values</label>
                                <input name="values" value={formData.values} onChange={handleChange} className={inputClass} placeholder="e.g. Sustainability, Honesty" />
                            </div>
                            <div>
                                <label className={labelClass}>Personality</label>
                                <input name="personality" value={formData.personality} onChange={handleChange} className={inputClass} placeholder="e.g. Bold, Direct, Funny" />
                            </div>
                            
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setStep(2)} className="w-1/3 bg-white border border-black/10 py-2 rounded-lg hover:bg-black/5">Back</button>
                                <button 
                                    onClick={handleWizardSubmit} 
                                    disabled={loading}
                                    className="w-2/3 bg-black text-white py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    {loading ? loadingMessage : "Generate Brand Strategy"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};
