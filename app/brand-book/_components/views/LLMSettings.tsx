
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { LLMSettings } from '../types';
import { Sliders, Save, AlertTriangle, MessageSquare, BrainCircuit, Play, Sparkles, RefreshCcw } from 'lucide-react';

export const LLMSettingsView: React.FC = () => {
  const { activeBrandId, brands, llmSettings, updateLLMSettings } = useAppStore();
  const activeBrand = brands.find(b => b.id === activeBrandId);
  
  // Find existing settings or default
  const currentSettings = llmSettings.find(s => s.brand_id === activeBrandId) || {
      brand_id: activeBrandId || '',
      tone_sliders: {
          formal_casual: 50,
          short_long: 50,
          fact_emotion: 50
      },
      forbidden_words: [],
      required_phrases: [],
      custom_instructions: ''
  };

  const [settings, setSettings] = useState<LLMSettings>(currentSettings);
  const [newForbidden, setNewForbidden] = useState("");
  const [newRequired, setNewRequired] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  if (!activeBrand) return <div>Select a brand.</div>;

  const handleSave = () => {
      updateLLMSettings(settings);
      alert("Brand Brain Updated! These settings will now apply to all AI generation tasks.");
  };

  const addForbidden = () => {
      if(newForbidden && !settings.forbidden_words.includes(newForbidden)) {
          setSettings({...settings, forbidden_words: [...settings.forbidden_words, newForbidden]});
          setNewForbidden("");
      }
  };

  const addRequired = () => {
      if(newRequired && !settings.required_phrases.includes(newRequired)) {
          setSettings({...settings, required_phrases: [...settings.required_phrases, newRequired]});
          setNewRequired("");
      }
  };

  const removeArrayItem = (type: 'forbidden' | 'required', val: string) => {
      if (type === 'forbidden') {
          setSettings({...settings, forbidden_words: settings.forbidden_words.filter(w => w !== val)});
      } else {
          setSettings({...settings, required_phrases: settings.required_phrases.filter(w => w !== val)});
      }
  };

  // Mock Test Function
  const handleTestVoice = () => {
      setIsTesting(true);
      setTimeout(() => {
          const tone = settings.tone_sliders.formal_casual > 70 ? "Hey bestie! ✨" : "Greetings.";
          const length = settings.tone_sliders.short_long > 70 ? "Here is a very detailed breakdown of our services..." : "Check this out.";
          setTestOutput(`${tone} This is a simulated response based on your configuration. ${length} \n\nWe avoided using: ${settings.forbidden_words.join(", ")}.`);
          setIsTesting(false);
      }, 1500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-40">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold font-serif-brand flex items-center gap-2">
                    <BrainCircuit size={32} className="text-blue-600" /> 
                    Brand Brain AI
                </h1>
                <p className="opacity-60">Configure the personality and constraints for the AI model generating {activeBrand.name}'s content.</p>
            </div>
            <button 
                onClick={handleSave}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:opacity-90 flex items-center gap-2"
            >
                <Save size={18} /> Save Configuration
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Tone Sliders */}
                <div className="bg-white p-8 rounded-xl border border-black/5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2"><Sliders size={18} /> Voice Modulation</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Fine-tune tone</span>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                                <span>Corporate / Formal</span>
                                <span>Casual / Gen-Z</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                className="w-full h-2 bg-gradient-to-r from-gray-300 to-blue-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={settings.tone_sliders.formal_casual}
                                onChange={(e) => setSettings({...settings, tone_sliders: {...settings.tone_sliders, formal_casual: parseInt(e.target.value)}})}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                                <span>Concise / Punchy</span>
                                <span>Storyteller / Detailed</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                className="w-full h-2 bg-gradient-to-r from-gray-300 to-blue-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={settings.tone_sliders.short_long}
                                onChange={(e) => setSettings({...settings, tone_sliders: {...settings.tone_sliders, short_long: parseInt(e.target.value)}})}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                                <span>Factual / Rational</span>
                                <span>Emotional / Evocative</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                className="w-full h-2 bg-gradient-to-r from-gray-300 to-blue-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={settings.tone_sliders.fact_emotion}
                                onChange={(e) => setSettings({...settings, tone_sliders: {...settings.tone_sliders, fact_emotion: parseInt(e.target.value)}})}
                            />
                        </div>
                    </div>
                </div>

                {/* Master Prompt */}
                <div className="bg-white p-8 rounded-xl border border-black/5 shadow-sm">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><BrainCircuit size={18} /> Master System Instruction</h3>
                    <p className="text-xs opacity-50 mb-4">This prompt is injected into <strong>every</strong> AI interaction (Strategy, Content, Emails). Use it to define the core persona.</p>
                    <textarea 
                        className="w-full h-40 border border-gray-200 rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono bg-gray-50"
                        placeholder="e.g. You are a wise, sustainability-focused architect. You prefer shorter sentences. You never use salesy language like 'Buy Now'. You prioritize educating the customer..."
                        value={settings.custom_instructions}
                        onChange={(e) => setSettings({...settings, custom_instructions: e.target.value})}
                    />
                </div>

                {/* Vocabulary Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-red-600"><AlertTriangle size={18} /> Forbidden Words</h3>
                        <p className="text-[10px] opacity-50 mb-3">The AI will strictly avoid these terms.</p>
                        <div className="flex gap-2 mb-4">
                            <input 
                                className="flex-1 border border-gray-200 rounded p-2 text-sm" 
                                placeholder="Add word..." 
                                value={newForbidden}
                                onChange={(e) => setNewForbidden(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addForbidden()}
                            />
                            <button onClick={addForbidden} className="px-3 bg-gray-100 rounded font-bold hover:bg-gray-200">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.forbidden_words.map(w => (
                                <span key={w} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold flex items-center gap-1 group border border-red-100">
                                    {w}
                                    <button onClick={() => removeArrayItem('forbidden', w)} className="opacity-0 group-hover:opacity-100 hover:text-red-800">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-green-600"><MessageSquare size={18} /> Key Phrases</h3>
                        <p className="text-[10px] opacity-50 mb-3">The AI will prioritize these keywords.</p>
                        <div className="flex gap-2 mb-4">
                            <input 
                                className="flex-1 border border-gray-200 rounded p-2 text-sm" 
                                placeholder="Add phrase..." 
                                value={newRequired}
                                onChange={(e) => setNewRequired(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addRequired()}
                            />
                            <button onClick={addRequired} className="px-3 bg-gray-100 rounded font-bold hover:bg-gray-200">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.required_phrases.map(w => (
                                <span key={w} className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1 group border border-green-100">
                                    {w}
                                    <button onClick={() => removeArrayItem('required', w)} className="opacity-0 group-hover:opacity-100 hover:text-green-800">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: TESTING */}
            <div className="space-y-6">
                <div className="bg-gradient-to-b from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm sticky top-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-900"><Sparkles size={18} /> Test Playground</h3>
                    <p className="text-xs text-blue-800 mb-4 leading-relaxed">
                        Generate a sample output to verify your tone settings before saving. This simulates a "Social Media Caption" generation.
                    </p>
                    
                    <button 
                        onClick={handleTestVoice}
                        disabled={isTesting}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 mb-6"
                    >
                        {isTesting ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
                        {isTesting ? "Generating..." : "Generate Sample"}
                    </button>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[200px] relative">
                        <span className="absolute top-2 right-2 text-[10px] font-mono text-gray-400">PREVIEW</span>
                        {testOutput ? (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                                {testOutput}
                            </p>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">
                                Output will appear here...
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};
