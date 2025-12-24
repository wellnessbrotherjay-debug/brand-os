import React, { useState } from 'react';
import { useAppStore } from '../store';
import { enhancePrompt, mockImageGeneration } from '../services/geminiService';
import { GeneratedAsset, Moodboard } from '../types';
import {
    Sparkles, Image as ImageIcon, Plus, Download, Layout,
    Palette, Mic, Wand2, Loader2, Save, Trash2, CheckCircle2
} from 'lucide-react';

export const CreativeStudio = () => {
    const {
        activeBrandId, brands, generatedAssets, addGeneratedAsset,
        moodboards, addToMoodboard, currentUser
    } = useAppStore();

    const activeBrand = brands.find(b => b.id === activeBrandId);

    const [prompt, setPrompt] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedMoodboardId, setSelectedMoodboardId] = useState<string>(moodboards[0]?.id || "");

    // Local state for the current session's "results" to show them immediately
    // In a real app we might just query `generatedAssets` filtered by a new 'session_id'
    const [currentResults, setCurrentResults] = useState<GeneratedAsset[]>([]);

    const handleEnhance = async () => {
        if (!prompt || !activeBrand) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhancePrompt(prompt, activeBrand);
            setPrompt(enhanced);
        } catch (e) {
            console.error("Enhance failed", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            // Simulate generation
            const imageUrls = await mockImageGeneration(prompt);

            const newAssets: GeneratedAsset[] = imageUrls.map(url => ({
                id: crypto.randomUUID(),
                prompt_id: 'session', // simplistic
                asset_type: 'image',
                file_url: url,
                status: 'ready',
                created_at: new Date().toISOString()
            }));

            // Add to global store
            newAssets.forEach(a => addGeneratedAsset(a));

            // Update local view
            setCurrentResults(newAssets);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToMoodboard = (assetId: string) => {
        if (!selectedMoodboardId) return;
        addToMoodboard(selectedMoodboardId, assetId);
        alert("Saved to Moodboard!");
    };

    return (
        <div className="flex h-full bg-white">
            {/* LEFT: STUDIO CONTROL */}
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Creative Studio</h1>
                                <p className="text-gray-500">Dream up new assets aligned with {activeBrand?.name}.</p>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Box */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-2 mb-8 focus-within:border-purple-200 transition-colors">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you want to create... (e.g., 'Modern minimal coffee cup on a marble table')"
                            className="w-full h-32 p-4 text-lg resize-none outline-none placeholder:text-gray-300"
                        />
                        <div className="flex justify-between items-center px-4 pb-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing}
                                    className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                    Magic Enhance
                                </button>
                                <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors">
                                    <Palette size={12} /> Style Reference
                                </button>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt}
                                className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Dreaming...
                                    </>
                                ) : (
                                    <>
                                        Create <Sparkles size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results Area */}
                    {currentResults.length > 0 ? (
                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {currentResults.map((asset, i) => (
                                <div key={asset.id} className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                    <img src={asset.file_url} className="w-full h-full object-cover" />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                        <button
                                            onClick={() => handleSaveToMoodboard(asset.id)}
                                            className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform flex items-center gap-2 font-bold text-xs"
                                        >
                                            <Save size={16} /> Save
                                        </button>
                                        <button className="bg-white/20 text-white p-3 rounded-full hover:bg-white/40 transition-colors">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                        <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">V{i + 1}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <ImageIcon size={32} />
                            </div>
                            <h3 className="text-gray-400 font-bold">Your canvas is empty</h3>
                            <p className="text-sm text-gray-300">Start by typing a prompt above.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* RIGHT: MOODBOARD SIDEBAR */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 flex flex-col sticky top-0 h-screen">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <Layout size={18} /> Moodboard
                    </h3>
                    <select
                        className="text-xs border-none bg-transparent font-bold text-gray-500 focus:ring-0 cursor-pointer"
                        value={selectedMoodboardId}
                        onChange={(e) => setSelectedMoodboardId(e.target.value)}
                    >
                        {moodboards.map(mb => (
                            <option key={mb.id} value={mb.id}>{mb.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {moodboards.find(m => m.id === selectedMoodboardId)?.asset_ids.length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-10">No assets saved yet.</p>
                    )}

                    {moodboards.find(m => m.id === selectedMoodboardId)?.asset_ids.map(assetId => {
                        const asset = generatedAssets.find(a => a.id === assetId);
                        if (!asset) return null;
                        return (
                            <div key={assetId} className="relative group rounded-xl overflow-hidden shadow-sm bg-white">
                                <img src={asset.file_url} className="w-full h-auto" />
                                <button className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-6 mt-auto border-t border-gray-200">
                    <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <Plus size={14} /> New Moodboard
                    </button>
                </div>
            </div>
        </div>
    );
};
