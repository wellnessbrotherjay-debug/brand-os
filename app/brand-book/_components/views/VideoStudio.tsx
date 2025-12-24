import React, { useState } from 'react';
import { useAppStore } from '../store';
import { generateVideoScript } from '../services/geminiService';
import { VideoProject, VideoScene } from '../types';
import {
    Film, Clapperboard, Sparkles, Play, Plus, Video as VideoIcon,
    MoreHorizontal, Loader2, Save, FileText, Image as ImageIcon
} from 'lucide-react';

export const VideoStudio = () => {
    const {
        activeBrandId, brands, videoProjects, createVideoProject,
        updateVideoScript, videoScenes, addVideoScene, updateSceneVisual
    } = useAppStore();

    const activeBrand = brands.find(b => b.id === activeBrandId);

    // In a real app we'd have a project selector.
    // Here we'll default to the first one or create a dummy one if empty.
    const activeProjectId = videoProjects[0]?.id;
    const activeProject = videoProjects.find(p => p.id === activeProjectId);

    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingVisuals, setIsGeneratingVisuals] = useState<Record<string, boolean>>({});

    const handleAIScript = async () => {
        if (!activeBrand || !activeProject) return;
        setIsGeneratingScript(true);
        try {
            const script = await generateVideoScript(activeProject.name, activeProject.format, activeBrand);
            updateVideoScript(activeProject.id, script);

            // Auto-parse scenes (Mock parse)
            // In reality we'd use regex to find [SCENE X] blocks
            if (videoScenes.filter(s => s.video_project_id === activeProject.id).length === 0) {
                const newScenes: VideoScene[] = [
                    { id: crypto.randomUUID(), video_project_id: activeProject.id, order: 1, duration_seconds: 3, description: "Wide shot of luxury lobby", asset_url: "" },
                    { id: crypto.randomUUID(), video_project_id: activeProject.id, order: 2, duration_seconds: 4, description: "Close up of keycard", asset_url: "" },
                    { id: crypto.randomUUID(), video_project_id: activeProject.id, order: 3, duration_seconds: 5, description: "Montage of amenities", asset_url: "" },
                    { id: crypto.randomUUID(), video_project_id: activeProject.id, order: 4, duration_seconds: 3, description: "Logo and CTA", asset_url: "" }
                ];
                newScenes.forEach(s => addVideoScene(s));
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateSceneVisual = (sceneId: string) => {
        setIsGeneratingVisuals(prev => ({ ...prev, [sceneId]: true }));
        // Mock generation
        setTimeout(() => {
            updateSceneVisual(sceneId, `https://picsum.photos/seed/${sceneId}/800/450`);
            setIsGeneratingVisuals(prev => ({ ...prev, [sceneId]: false }));
        }, 2000);
    };

    const projectScenes = videoScenes.filter(s => s.video_project_id === activeProjectId).sort((a, b) => a.order - b.order);

    if (!activeProject) {
        return (
            <div className="flex h-full items-center justify-center flex-col text-gray-400">
                <Clapperboard size={48} className="mb-4 opacity-20" />
                <p>No active video projects.</p>
                <button className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">Create Project</button>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-50">
            {/* LEFT: SCRIPT & CONFIG */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Clapperboard size={20} /> {activeProject.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded uppercase">{activeProject.format}</span>
                            <span className="text-xs text-gray-400">• {activeProject.duration_seconds}s</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="mb-4 flex justify-between items-end">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Video Script</label>
                        <button
                            onClick={handleAIScript}
                            disabled={isGeneratingScript}
                            className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-purple-100 transition-colors"
                        >
                            {isGeneratingScript ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI Writer
                        </button>
                    </div>
                    <textarea
                        className="w-full h-[calc(100vh-300px)] p-4 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-purple-200 text-sm leading-relaxed font-mono"
                        placeholder="Write your script here or use AI..."
                        value={activeProject.script}
                        onChange={(e) => updateVideoScript(activeProject.id, e.target.value)}
                    />
                </div>
            </div>

            {/* RIGHT: VISUAL BOARD */}
            <div className="w-1/2 flex flex-col bg-gray-50/50">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                        <Film size={16} /> Scene Board
                    </h2>
                    <button className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1">
                        <Play size={12} /> Preview
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {projectScenes.length === 0 && (
                        <div className="text-center py-10 opacity-40">
                            <Film size={32} className="mx-auto mb-2" />
                            <p className="text-xs">Generate a script to see scenes.</p>
                        </div>
                    )}

                    {projectScenes.map((scene, i) => (
                        <div key={scene.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
                            {/* Visual Preview */}
                            <div className="w-48 aspect-video bg-gray-100 relative group shrink-0">
                                {scene.asset_url ? (
                                    <img src={scene.asset_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <ImageIcon size={24} className="mb-1" />
                                        <span className="text-[10px] uppercase font-bold">No Visual</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleGenerateSceneVisual(scene.id)}
                                        disabled={isGeneratingVisuals[scene.id]}
                                        className="bg-white text-black p-2 rounded-full text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform"
                                    >
                                        {isGeneratingVisuals[scene.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">SCENE {i + 1}</span>
                                        <span className="text-xs text-gray-400 font-mono">{scene.duration_seconds}s</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{scene.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {projectScenes.length > 0 && (
                        <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-xs hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2">
                            <Plus size={14} /> Add Scene
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
