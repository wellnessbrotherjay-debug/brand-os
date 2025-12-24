import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Eye, Trash2, Plus, Wallet, MapPin, Briefcase, Target, User, ChevronLeft, ChevronRight, Check, Sparkles, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { AvatarProfile } from '../types';

const PRESET_FACES = [
    { name: 'The Power Achiever', url: '/coaches/mike-chen.png' },
    { name: 'The Mindful Minimalist', url: '/coaches/sarah-liu.png' },
    { name: 'The High Performer', url: '/coaches/alex-wong.png' },
    { name: 'The Aesthetic Visionary', url: '/coaches/emma-park.png' },
    { name: 'The Explosive Dynamic', url: '/coaches/danny-kim.png' },
    { name: 'The Strength Specialist', url: '/coaches/jessica-tan.png' },
];

type ViewMode = 'dashboard' | 'wizard' | 'detail';

export const CustomerAvatar: React.FC = () => {
    const { activeBrandId, brands, identities, updateIdentity, addAsset, updateAvatar, addAvatar, deleteAvatar } = useAppStore();
    const avatarImageRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

    // Wizard State
    const [wizardData, setWizardData] = useState<Partial<AvatarProfile>>({});

    const activeBrand = brands.find(b => b.id === activeBrandId);
    const identity = identities.find(i => i.brand_id === activeBrandId);

    // Initial Migration Logic
    useEffect(() => {
        if (!identity) return;
        // If single profile exists but array is empty, migrate it.
        const hasLegacy = identity.avatar_profile && Object.keys(identity.avatar_profile).length > 0;
        const hasArray = identity.avatars && identity.avatars.length > 0;

        if (hasLegacy && !hasArray) {
            const legacyAvatar: AvatarProfile = {
                ...identity.avatar_profile!,
                id: crypto.randomUUID(),
                name: identity.avatar_profile?.name || 'Primary Persona',
            };
            addAvatar(legacyAvatar);
        }
    }, [identity, identity?.avatar_profile]);


    if (!activeBrand || !identity) return <div>Loading...</div>;

    const avatars = identity.avatars || [];
    const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);

    // BRAND STYLING
    const brandFontHeading = identity.font_heading || 'serif';
    const brandFontBody = identity.font_body || 'sans-serif';
    const brandColorPrimary = identity.color_primary_hex || '#000000';
    const brandColorSecondary = identity.color_secondary_hex || '#f5f5f5';

    // --- WIZARD HANDLERS ---

    const startNewAvatar = () => {
        setWizardData({});
        setSelectedAvatarId(null);
        setCurrentStep(1);
        setViewMode('wizard');
    };

    const editAvatar = (avatar: AvatarProfile) => {
        setWizardData(avatar);
        setSelectedAvatarId(avatar.id);
        setCurrentStep(1);
        setViewMode('wizard');
    };

    const handleWizardChange = (field: keyof AvatarProfile, value: any) => {
        setWizardData(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const currentImages = wizardData.avatar_images || [];
                const newImages = [result, ...currentImages].slice(0, 1); // Keep primary

                handleWizardChange('avatar_images', newImages);

                addAsset({
                    id: crypto.randomUUID(),
                    brand_id: activeBrand.id,
                    asset_type: 'image',
                    title: `Avatar - ${file.name}`,
                    description: 'Avatar Persona Image',
                    file_url: result,
                    tags: ['avatar', 'persona']
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const selectFace = (url: string) => {
        handleWizardChange('avatar_images', [url]);
    };

    const saveAvatar = () => {
        if (selectedAvatarId) {
            updateAvatar(selectedAvatarId, wizardData);
        } else {
            addAvatar({
                ...wizardData,
                id: crypto.randomUUID(),
                name: wizardData.name || 'New Persona'
            });
        }
        setViewMode('dashboard');
    };

    const navWizard = (dir: 1 | -1) => {
        setCurrentStep(prev => Math.min(Math.max(prev + dir, 1), 6));
    };

    // --- RENDERERS ---

    if (viewMode === 'detail' && selectedAvatar) {
        return (
            <div className="p-8 max-w-5xl mx-auto h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-full mb-4 flex justify-between items-center">
                    <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/5 transition-colors">
                        <ArrowLeft size={20} /> Back to Avatars
                    </button>
                    <button onClick={() => editAvatar(selectedAvatar)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:scale-105 transition-transform">
                        Edit Persona
                    </button>
                </div>

                <div
                    className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative"
                    style={{ fontFamily: brandFontBody }}
                >
                    {/* ID Card Left: Photo & Key Stats */}
                    <div className="md:w-2/5 p-8 text-white relative flex flex-col" style={{ backgroundColor: brandColorPrimary }}>
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mb-8 border-4 border-white/10 relative">
                            {selectedAvatar.avatar_images?.[0] ? (
                                <img src={selectedAvatar.avatar_images[0]} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20">No Image</div>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: brandFontHeading }}>{selectedAvatar.name}</h2>
                        <p className="opacity-80 text-lg mb-6">{selectedAvatar.occupation}</p>

                        <div className="space-y-4 mt-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><User size={16} /></div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest opacity-60">Age / Gender</p>
                                    <p className="font-medium">{selectedAvatar.age_range} • {selectedAvatar.gender}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><MapPin size={16} /></div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest opacity-60">Location</p>
                                    <p className="font-medium">{selectedAvatar.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Wallet size={16} /></div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest opacity-60">Income</p>
                                    <p className="font-medium">{selectedAvatar.net_worth}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Goals & Psychology */}
                    <div className="flex-1 p-10 bg-white relative">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <Sparkles size={120} />
                        </div>

                        <div className="grid grid-cols-1 gap-10">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                                    <Target size={18} style={{ color: brandColorPrimary }} /> Core Goals & Vision
                                </h3>
                                <div className="p-6 rounded-xl bg-gray-50 border-l-4" style={{ borderColor: brandColorPrimary }}>
                                    <p className="text-xl leading-relaxed italic opacity-80 whitespace-pre-line">
                                        &ldquo;{selectedAvatar.goals || "No goals defined yet."}&rdquo;
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Interests</h3>
                                    <p className="leading-relaxed opacity-70">{selectedAvatar.key_interests || "None listed."}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Pain Points</h3>
                                    <p className="leading-relaxed text-red-500/80 font-medium">{selectedAvatar.pain_points || "None listed."}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                            <span className="text-xs font-mono uppercase">ID: {selectedAvatar.id.split('-')[0]}</span>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'wizard') {
        const profile = wizardData;
        return (
            <div className="p-8 max-w-5xl mx-auto pb-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Step {currentStep} of 6</span>
                        </div>
                        <h1 className="text-4xl font-bold font-serif-brand">{selectedAvatarId ? 'Edit Persona' : 'New Persona'}</h1>
                    </div>
                    <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                </header>

                <div className="bg-white rounded-2xl border border-black/10 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="flex-1 p-10">
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><User size={24} /> 1. Core Persona</h2>
                                <div className="space-y-6 max-w-xl">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Persona Internal Name</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. Executive Emma"
                                            value={profile.name || ''}
                                            onChange={(e) => handleWizardChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Professional Role / Occupation</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. Senior Tech Lead"
                                            value={profile.occupation || ''}
                                            onChange={(e) => handleWizardChange('occupation', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin size={24} /> 2. Demographics</h2>
                                <div className="grid grid-cols-2 gap-10 max-w-2xl">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Age Range</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. 28 - 35"
                                            value={profile.age_range || ''}
                                            onChange={(e) => handleWizardChange('age_range', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Gender Identity</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. Female"
                                            value={profile.gender || ''}
                                            onChange={(e) => handleWizardChange('gender', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Primary Location</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. London / Remote"
                                            value={profile.location || ''}
                                            onChange={(e) => handleWizardChange('location', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Wallet size={24} /> 3. Lifestyle & Finance</h2>
                                <div className="grid grid-cols-2 gap-10 max-w-2xl">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Net Worth Estimate</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent font-mono"
                                            placeholder="e.g. $250k+"
                                            value={profile.net_worth || ''}
                                            onChange={(e) => handleWizardChange('net_worth', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Spending Habits</label>
                                        <input
                                            className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                            placeholder="e.g. Luxury Conscious"
                                            value={profile.spending_power || ''}
                                            onChange={(e) => handleWizardChange('spending_power', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Target size={24} /> 4. Goals & Desires</h2>
                                <div className="space-y-8 max-w-xl">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Meta Interests</label>
                                        <textarea
                                            className="w-full border-2 border-black/5 rounded-xl p-4 text-lg outline-none focus:border-black transition-colors min-h-[100px]"
                                            placeholder="What do they follow? What are their hobbies?"
                                            value={profile.key_interests || ''}
                                            onChange={(e) => handleWizardChange('key_interests', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Core Life Goals</label>
                                        <textarea
                                            className="w-full border-2 border-black/5 rounded-xl p-4 text-lg outline-none focus:border-black transition-colors min-h-[100px]"
                                            placeholder="What is their 5-year vision?"
                                            value={profile.goals || ''}
                                            onChange={(e) => handleWizardChange('goals', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-500"><Sparkles size={24} /> 5. Pain Points</h2>
                                <div className="max-w-xl">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">What keeps them up at night?</label>
                                    <textarea
                                        className="w-full border-2 border-red-500/10 focus:border-red-500 rounded-2xl p-6 text-xl outline-none transition-all min-h-[250px] bg-red-50/10"
                                        placeholder="Describe their frustrations, fears, and immediate problems..."
                                        value={profile.pain_points || ''}
                                        onChange={(e) => handleWizardChange('pain_points', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 mb-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Eye size={24} /> 6. Select the Face</h2>
                                    <button
                                        onClick={() => avatarImageRef.current?.click()}
                                        className="text-xs font-bold uppercase tracking-widest border border-black/10 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all"
                                    >
                                        Upload Custom
                                    </button>
                                    <input type="file" ref={avatarImageRef} className="hidden" accept="image/*" onChange={handleAvatarImageUpload} />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {PRESET_FACES.map((face) => {
                                        const isSelected = profile.avatar_images?.[0] === face.url;
                                        return (
                                            <div
                                                key={face.url}
                                                onClick={() => selectFace(face.url)}
                                                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-4 ring-black p-1' : 'hover:scale-[1.02]'}`}
                                            >
                                                <div className="w-full h-full relative rounded-xl overflow-hidden">
                                                    <img src={face.url} className="w-full h-full object-cover" alt={face.name} />
                                                    <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <p className="text-white text-xs font-bold uppercase tracking-wider mb-2">{face.name}</p>
                                                        {isSelected && <div className="bg-white text-black p-2 rounded-full"><Check size={16} /></div>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar */}
                    <div className="bg-gray-50/50 border-t border-black/5 p-6 flex justify-between items-center">
                        <button
                            onClick={() => navWizard(-1)}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 font-bold text-sm uppercase tracking-widest px-6 py-3 transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-black/5 rounded-xl'}`}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5, 6].map(s => (
                                <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${s === currentStep ? 'bg-black w-4' : 'bg-black/10'}`} />
                            ))}
                        </div>

                        {currentStep < 6 ? (
                            <button
                                onClick={() => navWizard(1)}
                                className="bg-black text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl hover:opacity-80 shadow-lg active:scale-95 transition-all"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={saveAvatar}
                                className="bg-green-600 text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-green-700 shadow-lg active:scale-95 transition-all"
                            >
                                Save Persona <Check size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // DASHBOARD VIEW (DEFAULT)
    return (
        <div className="p-8 max-w-6xl mx-auto pb-40">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold font-serif-brand">Client Avatars</h1>
                    <p className="opacity-60">Manage your ideal customer personas.</p>
                </div>
                <button
                    onClick={startNewAvatar}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> New Persona
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* List Avatars */}
                {avatars.map(avatar => (
                    <div
                        key={avatar.id}
                        onClick={() => { setSelectedAvatarId(avatar.id); setViewMode('detail'); }}
                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col relative"
                    >
                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            {avatar.avatar_images?.[0] ? (
                                <img src={avatar.avatar_images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={48} /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                            <div className="absolute bottom-6 left-6 text-white transform group-hover:translate-y-[-4px] transition-transform">
                                <h3 className="text-xl font-bold">{avatar.name}</h3>
                                <p className="text-sm opacity-80">{avatar.occupation}</p>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Target size={14} className="text-black" />
                                    <span className="truncate">{avatar.goals ? avatar.goals.substring(0, 30) + '...' : 'No goals defined'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Wallet size={14} className="text-black" />
                                    <span>{avatar.net_worth || 'N/A'}</span>
                                </div>
                            </div>

                            <button className="mt-auto w-full py-2 border border-black/5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                                View Full Identity
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Card */}
                {avatars.length === 0 && (
                    <div
                        onClick={startNewAvatar}
                        className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-12 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all min-h-[400px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                            <Plus size={32} className="text-gray-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Create Your First Avatar</h3>
                        <p className="text-sm text-gray-400 max-w-[200px]">Define the person you want to serve.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
