
import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { analyzeBrandText, generateBrandStrategy } from '../services/geminiService';
import { Brand, BrandStrategySection, StrategySectionType, BrandIdentity, KnowledgeSource } from '../types';
import { Loader2, Sparkles, FileText, CheckCircle2, AlertCircle, Upload, X, Trash2, Image as ImageIcon, Plus, Palette } from 'lucide-react';


const REQUIRED_ASSETS = [
    {
        key: 'logo_primary_url',
        label: 'Primary Logo',
        description: 'Your main brand identifier. Preferably SVG or transparent PNG.',
        context: 'Used in the header, social kits, and official documents.'
    },
    {
        key: 'cover',
        label: 'Brand Book Cover',
        description: 'High-resolution landscape image (16:9 aspect ratio).',
        context: 'The front face of your Brand Book PDF. Should capture the brand essence immediately.'
    },
    {
        key: 'about',
        label: 'Brand Essence Visual',
        description: 'Portrait or square editorial shot.',
        context: 'Used on the "About" page of the brand book to accompany your mission statement.'
    },
    {
        key: 'moodboard_0',
        label: 'Social Avatar / Icon',
        description: 'Square (1:1). Clear and legible at small sizes.',
        context: 'Your profile picture on Instagram, LinkedIn, and internal comments.'
    },
    {
        key: 'moodboard_1',
        label: 'Moodboard Hero',
        description: 'Vertical or flexible aspect ratio. Atmospheric.',
        context: 'Part of the visual universe collage. Sets the "vibe" (lighting, texture, feeling).'
    },
    {
        key: 'facebook_cover',
        label: 'Facebook Cover',
        description: 'Landscape (820px x 312px).',
        context: 'Header image for your Facebook Page.'
    },
    {
        key: 'youtube_banner',
        label: 'YouTube Banner',
        description: 'Landscape (2560px x 1440px).',
        context: 'Channel art for YouTube.'
    },
    {
        key: 'tiktok_template_1',
        label: 'TikTok Video Cover 1',
        description: 'Portrait (9:16). Text overlay ready.',
        context: 'Standard cover for educational reels.'
    },
    {
        key: 'tiktok_template_2',
        label: 'TikTok Video Cover 2',
        description: 'Portrait (9:16). Viral hook style.',
        context: 'Alternate cover style for trending audio reels.'
    }
];

export const BrandMaster: React.FC<{ setView: (v: any) => void }> = ({ setView }) => {
    const {
        addBrand, updateBrand, addStrategySections, updateIdentity, identities, brands, activeBrandId,
        strategySections, addAsset,
        knowledgeSources, addKnowledgeSource, removeKnowledgeSource,
        activeOriginSection, setActiveOriginSection
    } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    // Local sources removed in favor of store
    const [textInput, setTextInput] = useState("");
    const [isAddingText, setIsAddingText] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const assetInputRef = useRef<HTMLInputElement>(null);
    const [targetAssetSlot, setTargetAssetSlot] = useState<string | null>(null);

    const activeBrand = brands.find(b => b.id === activeBrandId);
    const activeIdentity = identities.find(i => i.brand_id === activeBrandId);
    const activeStrategy = strategySections.filter(s => s.brand_id === activeBrandId);

    // --- KNOWLEDGE BASE LOGIC ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                addKnowledgeSource({
                    id: crypto.randomUUID(),
                    brand_id: activeBrandId || 'new',
                    type: 'file',
                    name: file.name,
                    content: base64String, // Store raw base64
                    mime_type: file.type,
                    preview: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addTextSource = () => {
        if (!textInput.trim()) return;
        addKnowledgeSource({
            id: crypto.randomUUID(),
            brand_id: activeBrandId || 'new',
            type: 'text',
            name: 'Text Snippet',
            content: textInput,
            preview: textInput.substring(0, 50) + '...'
        });
        setTextInput("");
        setIsAddingText(false);
    };

    const removeSource = (id: string) => {
        removeKnowledgeSource(id);
    };

    // --- ASSET LOGIC ---

    const triggerAssetUpload = (slotKey: string) => {
        setTargetAssetSlot(slotKey);
        assetInputRef.current?.click();
    };

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && targetAssetSlot && activeIdentity) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result as string;

                // 1. Update Identity / Config
                const newIdentity = { ...activeIdentity };

                if (targetAssetSlot === 'logo_primary_url') {
                    newIdentity.logo_primary_url = url;
                } else if (targetAssetSlot.startsWith('moodboard_')) {
                    // Ensure array exists
                    const config = { ...newIdentity.brand_book_config };
                    const idx = parseInt(targetAssetSlot.split('_')[1]);
                    const currentImages = [...(config.moodboard_images || [])];
                    while (currentImages.length <= idx) currentImages.push('');
                    currentImages[idx] = url;
                    config.moodboard_images = currentImages;
                    newIdentity.brand_book_config = config;
                } else {
                    // Generic config keys (cover, about, social covers)
                    const config = { ...newIdentity.brand_book_config };
                    (config as any)[targetAssetSlot + '_image_url'] = url;
                    newIdentity.brand_book_config = config;
                }

                updateIdentity(newIdentity);

                // 2. Add to Asset Library
                if (activeBrandId) {
                    addAsset({
                        id: crypto.randomUUID(),
                        brand_id: activeBrandId,
                        asset_type: 'image',
                        title: file.name,
                        description: `Uploaded for ${targetAssetSlot}`,
                        file_url: url,
                        tags: ['upload', targetAssetSlot]
                    });
                }

                setTargetAssetSlot(null);
            };
            reader.readAsDataURL(file);
        }
        if (assetInputRef.current) assetInputRef.current.value = '';
    };

    const getAssetPreview = (key: string) => {
        if (!activeIdentity) return null;
        if (key === 'logo_primary_url') return activeIdentity.logo_primary_url;
        if (key.startsWith('moodboard_')) {
            const idx = parseInt(key.split('_')[1]);
            return activeIdentity.brand_book_config?.moodboard_images?.[idx];
        }
        return (activeIdentity.brand_book_config as any)?.[key + '_image_url'];
    };

    // --- PROCESSING LOGIC ---

    const handleProcess = async () => {
        if (knowledgeSources.length === 0) return alert("Please add at least one text or file source.");

        setLoading(true);
        setLoadingMessage("Deconstructing Brand DNA...");

        try {
            // Prepare inputs
            const inputs = knowledgeSources.map(s => {
                if (s.type === 'text') return s.content;
                // For files, construct input object. Ensure content is compliant.
                return { mimeType: s.mime_type || 'application/pdf', data: s.content };
            });

            // 1. Analyze Text/File (Extract Core Info & Identity)
            const analysis = await analyzeBrandText(inputs);

            let targetBrandId = activeBrandId;
            let finalBrandObj: Brand;

            if (!activeBrandId || activeBrandId === 'new') {
                const newBrand: Brand = { id: crypto.randomUUID(), ...analysis.brand };
                addBrand(newBrand);
                targetBrandId = newBrand.id;
                finalBrandObj = newBrand;
            } else {
                updateBrand(activeBrandId, analysis.brand);
                targetBrandId = activeBrandId;
                finalBrandObj = { ...analysis.brand, id: activeBrandId };
            }

            // 2. Update Identity (Preserve existing manual uploads if analysis returns empty)
            if (analysis.identity && targetBrandId) {
                const existingIdentity = identities.find(i => i.brand_id === targetBrandId);
                const newIdentity = {
                    ...existingIdentity,
                    id: existingIdentity?.id || crypto.randomUUID(),
                    brand_id: targetBrandId,
                    color_primary_hex: analysis.identity.color_primary_hex || existingIdentity?.color_primary_hex || '#FFFFFF',
                    color_secondary_hex: analysis.identity.color_secondary_hex || existingIdentity?.color_secondary_hex || '#F3EFEA',
                    color_accent_hex: analysis.identity.color_accent_hex || existingIdentity?.color_accent_hex || '#000000',
                    font_heading: analysis.identity.font_heading || existingIdentity?.font_heading || 'Cormorant Garamond',
                    font_body: analysis.identity.font_body || existingIdentity?.font_body || 'Inter',
                    image_style: analysis.identity.image_style || existingIdentity?.image_style || '',
                    video_style: analysis.identity.video_style || existingIdentity?.video_style || '',
                    do_nots: analysis.identity.do_nots || existingIdentity?.do_nots || '',
                    logo_rules: analysis.identity.logo_rules || existingIdentity?.logo_rules || '',
                } as BrandIdentity;
                updateIdentity(newIdentity);
            }

            // 3. Generate/Update Strategy (Extract Sections)
            if (targetBrandId) {
                setLoadingMessage("Mapping Strategy Sections...");
                const aiResponse = await generateBrandStrategy(finalBrandObj, inputs);

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
                    'brand_architecture': StrategySectionType.BrandArchitecture,
                    'five_pillars': StrategySectionType.FivePillars,
                    'competitive_benchmark': StrategySectionType.CompetitiveBenchmark,
                    'guest_experience': StrategySectionType.GuestExperience
                };

                const sections: BrandStrategySection[] = Object.entries(aiResponse).map(([key, content]) => {
                    return {
                        id: crypto.randomUUID(),
                        brand_id: targetBrandId!,
                        section_type: sectionTypeMap[key] || StrategySectionType.Purpose,
                        content: String(content),
                        source: 'ai',
                        updated_at: new Date().toISOString()
                    };
                });

                addStrategySections(sections);
            }

            // Do not clear sources automatically as they are persistent now.
            // setSources([]);
            alert("Brand extracted successfully! The system is now populated.");

        } catch (e) {
            console.error(e);
            alert("Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- STATS CALC ---
    const requiredStrategy = [
        StrategySectionType.Mission,
        StrategySectionType.Vision,
        StrategySectionType.UVP,
        StrategySectionType.ToneOfVoice,
        StrategySectionType.BrandStory,
        StrategySectionType.CreativeDirection,
        StrategySectionType.FivePillars,
        StrategySectionType.BrandArchitecture
    ];
    const strategyStatus = requiredStrategy.map(type => ({
        name: type,
        complete: activeStrategy.some(s => s.section_type === type && s.content.length > 20)
    }));
    const identityStatus = [
        { name: 'Primary Logo', complete: !!activeIdentity?.logo_primary_url },
        { name: 'Color Palette', complete: !!activeIdentity?.color_primary_hex && activeIdentity?.color_primary_hex !== '#FFFFFF' },
        { name: 'Typography', complete: !!activeIdentity?.font_heading && activeIdentity?.font_heading !== 'Sans Serif' },
        { name: 'Visual Rules', complete: !!activeIdentity?.do_nots }
    ];
    const totalChecks = strategyStatus.length + identityStatus.length;
    const completedChecks = strategyStatus.filter(s => s.complete).length + identityStatus.filter(s => s.complete).length;
    const progress = Math.round((completedChecks / totalChecks) * 100);

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-serif-brand">Brand Origin & Assets</h1>
                    <p className="opacity-60">The source of truth. Upload knowledge and key visuals to power the system.</p>
                </div>
                {activeIdentity?.logo_primary_url && (
                    <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">

                {/* MAIN CONTENT AREA (2 Cols) */}
                <div className="lg:col-span-2 space-y-8 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-180px)]">

                    {/* SECTION: KNOWLEDGE BASE */}
                    {activeOriginSection === 'knowledge' && (
                        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm animate-in fade-in duration-300">
                            <h2 className="font-bold mb-4 flex items-center gap-2">
                                <FileText size={18} /> Knowledge Base
                            </h2>
                            <p className="text-xs opacity-60 mb-4">Upload PDFs, Brand Books, or paste text to be analyzed by AI.</p>

                            {/* Source List */}
                            <div className="space-y-2 mb-4">
                                {knowledgeSources.map(source => (
                                    <div key={source.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-black/5 text-sm">
                                        <div className="flex items-center gap-3">
                                            {source.type === 'file' ? <FileText size={16} className="opacity-50" /> : <Sparkles size={16} className="opacity-50" />}
                                            <span className="font-medium truncate max-w-[200px]">{source.name}</span>
                                        </div>
                                        <button onClick={() => removeKnowledgeSource(source.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {knowledgeSources.length === 0 && <div className="text-center p-8 text-gray-400 text-xs italic">No sources added yet.</div>}
                            </div>

                            {/* Add Buttons */}
                            {!isAddingText ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-3 border-2 border-dashed border-black/10 rounded-lg text-sm font-medium hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} /> Upload PDF
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />

                                    <button
                                        onClick={() => setIsAddingText(true)}
                                        className="flex-1 py-3 border-2 border-dashed border-black/10 rounded-lg text-sm font-medium hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Text
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded border border-black/5 animate-in fade-in">
                                    <textarea
                                        className="w-full bg-white border border-black/10 rounded p-2 text-sm min-h-[100px] mb-2"
                                        placeholder="Paste text here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsAddingText(false)} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-black">Cancel</button>
                                        <button
                                            onClick={() => {
                                                if (textInput.trim()) {
                                                    addKnowledgeSource({
                                                        id: crypto.randomUUID(),
                                                        brand_id: activeBrandId || 'new',
                                                        type: 'text',
                                                        name: 'Pasted Text Snippet',
                                                        content: textInput,
                                                        created_at: new Date().toISOString()
                                                    });
                                                    setTextInput("");
                                                    setIsAddingText(false);
                                                }
                                            }}
                                            className="bg-black text-white px-3 py-1 text-xs font-bold rounded"
                                        >
                                            Add Text
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleProcess}
                                disabled={loading || knowledgeSources.length === 0}
                                className="w-full mt-6 bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                {loading ? loadingMessage : "Analyze & Extract Data"}
                            </button>
                        </div>
                    )}

                    {/* SECTION: VISUAL ASSETS */}
                    {activeOriginSection === 'visuals' && (
                        <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm animate-in fade-in duration-300">
                            <h2 className="font-bold mb-4 flex items-center gap-2">
                                <ImageIcon size={18} /> Visual Asset Studio
                            </h2>
                            <p className="text-xs opacity-60 mb-6">Upload specific assets to populate the Brand Book and Social Kit.</p>

                            <div className="space-y-4">
                                {REQUIRED_ASSETS.map((asset) => {
                                    const previewUrl = getAssetPreview(asset.key);
                                    return (
                                        <div key={asset.key} className="flex gap-4 p-4 border border-black/5 rounded-xl hover:bg-gray-50 transition-colors">
                                            {/* Preview / Upload Box */}
                                            <div
                                                onClick={() => triggerAssetUpload(asset.key)}
                                                className="w-24 h-24 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-transparent hover:border-black/10 transition-all relative group"
                                            >
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Upload className="opacity-20" />
                                                )}
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="text-white" size={24} />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-sm">{asset.label}</h3>
                                                    {previewUrl && <CheckCircle2 size={16} className="text-green-500" />}
                                                </div>
                                                <p className="text-xs text-black/70 mb-2">{asset.description}</p>
                                                <div className="bg-blue-50 text-blue-800 text-[10px] p-2 rounded inline-block">
                                                    <strong>Usage:</strong> {asset.context}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <input type="file" ref={assetInputRef} className="hidden" accept="image/*" onChange={handleAssetUpload} />
                        </div>
                    )}

                    {/* SECTION: STRATEGY LAYER */}
                    {activeOriginSection === 'strategy' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                                <h2 className="font-bold mb-2 flex items-center gap-2"><Sparkles size={18} /> Strategy Layer</h2>
                                <p className="text-sm opacity-60">Core strategic definitions generated by AI or defined manually.</p>
                            </div>

                            {activeStrategy.length === 0 ? (
                                <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="opacity-50 text-sm mb-4">No strategy sections defined yet.</p>
                                    <button onClick={() => setActiveOriginSection('knowledge')} className="text-blue-600 underline text-sm">Go to Knowledge Base to Generate</button>
                                </div>
                            ) : (
                                activeStrategy.map(section => (
                                    <div key={section.id} className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg capitalize">{section.section_type.replace(/_/g, ' ')}</h3>
                                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded uppercase tracking-wider opacity-60">{section.source}</span>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-gray-600">
                                            <p>{section.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SECTION: IDENTITY & CORE */}
                    {activeOriginSection === 'identity' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                                <h2 className="font-bold mb-2 flex items-center gap-2"><Palette size={18} /> Identity & Core</h2>
                                <p className="text-sm opacity-60">Visual identity Configuration.</p>
                            </div>

                            {activeIdentity ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-black/5">
                                        <label className="text-xs font-bold uppercase block mb-1 opacity-50">Primary Color</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: activeIdentity.color_primary_hex }}></div>
                                            <span className="font-mono text-sm">{activeIdentity.color_primary_hex}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-black/5">
                                        <label className="text-xs font-bold uppercase block mb-1 opacity-50">Secondary Color</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: activeIdentity.color_secondary_hex }}></div>
                                            <span className="font-mono text-sm">{activeIdentity.color_secondary_hex}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-black/5">
                                        <label className="text-xs font-bold uppercase block mb-1 opacity-50">Heading Font</label>
                                        <span className="font-serif-brand text-xl">{activeIdentity.font_heading}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-black/5">
                                        <label className="text-xs font-bold uppercase block mb-1 opacity-50">Body Font</label>
                                        <span className="font-sans text-xl">{activeIdentity.font_body}</span>
                                    </div>
                                    <div className="col-span-2 bg-white p-4 rounded-lg border border-black/5">
                                        <label className="text-xs font-bold uppercase block mb-1 opacity-50">Do Nots / Rules</label>
                                        <p className="text-sm opacity-80">{activeIdentity.do_nots || 'No specific rules defined.'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">No Identity Found.</div>
                            )}
                        </div>
                    )}

                </div>

                {/* RIGHT COLUMN: AUDIT / STATUS (Stays Visible for Context) */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-xl border border-black/5 shadow-sm mb-8 sticky top-0">
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-xl font-bold">System Health</h2>
                            <span className="text-4xl font-bold font-serif-brand">{progress}%</span>
                        </div>
                        <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs opacity-50 mt-4">Calculated based on Strategy Sections, Core Identity, and Visual Assets.</p>
                    </div>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Strategy Layer</h3>
                            <div className="space-y-2">
                                {strategyStatus.map((s) => (
                                    <button
                                        key={s.name}
                                        onClick={() => setActiveOriginSection('strategy')}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-black/5 bg-white hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span className="text-sm font-medium">{s.name}</span>
                                        {s.complete ? (
                                            <CheckCircle2 size={16} className="text-green-500" />
                                        ) : (
                                            <AlertCircle size={16} className="text-orange-400 opacity-50" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Identity Layer</h3>
                            <div className="space-y-2">
                                {identityStatus.map((s) => (
                                    <button
                                        key={s.name}
                                        onClick={() => setActiveOriginSection('identity')}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-black/5 bg-white hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span className="text-sm font-medium">{s.name}</span>
                                        {s.complete ? (
                                            <CheckCircle2 size={16} className="text-green-500" />
                                        ) : (
                                            <AlertCircle size={16} className="text-orange-400 opacity-50" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
