
import React, { useRef, useState } from 'react';
import { useAppStore } from '../store';
import { Eye, Trash2, Plus, Wallet, MapPin, Briefcase, Target, User, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { AvatarProfile } from '../types';

const PRESET_FACES = [
    { name: 'The Power Achiever', url: '/coaches/mike-chen.png' },
    { name: 'The Mindful Minimalist', url: '/coaches/sarah-liu.png' },
    { name: 'The High Performer', url: '/coaches/alex-wong.png' },
    { name: 'The Aesthetic Visionary', url: '/coaches/emma-park.png' },
    { name: 'The Explosive Dynamic', url: '/coaches/danny-kim.png' },
    { name: 'The Strength Specialist', url: '/coaches/jessica-tan.png' },
];

export const CustomerAvatar: React.FC = () => {
    const { activeBrandId, brands, identities, updateIdentity, addAsset } = useAppStore();
    const avatarImageRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const activeBrand = brands.find(b => b.id === activeBrandId);
    const identity = identities.find(i => i.brand_id === activeBrandId);

    if (!activeBrand || !identity) return <div>Loading...</div>;

    const handleAvatarChange = (field: keyof AvatarProfile, value: any) => {
        const currentAvatar = identity.avatar_profile || {};
        updateIdentity({
            ...identity,
            avatar_profile: { ...currentAvatar, [field]: value }
        });
    };

    const handleAvatarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const currentImages = identity.avatar_profile?.avatar_images || [];
                const newImages = [result, ...currentImages].slice(0, 1); // Keep primary

                handleAvatarChange('avatar_images', newImages);

                addAsset({
                    id: crypto.randomUUID(),
                    brand_id: activeBrand.id,
                    asset_type: 'image',
                    title: file.name,
                    description: 'Avatar Persona Image',
                    file_url: result,
                    tags: ['avatar', 'persona']
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const selectFace = (url: string) => {
        handleAvatarChange('avatar_images', [url]);
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const profile = identity.avatar_profile || {};

    return (
        <div className="p-8 max-w-5xl mx-auto pb-40">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Step {currentStep} of 6</span>
                    <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-500 ease-out"
                            style={{ width: `${(currentStep / 6) * 100}%` }}
                        />
                    </div>
                </div>
                <h1 className="text-4xl font-bold font-serif-brand">Avatar Builder</h1>
                <p className="opacity-60">Crafting the digital twin of your ideal customer.</p>
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
                                        onChange={(e) => handleAvatarChange('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Professional Role / Occupation</label>
                                    <input
                                        className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                        placeholder="e.g. Senior Tech Lead"
                                        value={profile.occupation || ''}
                                        onChange={(e) => handleAvatarChange('occupation', e.target.value)}
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
                                        onChange={(e) => handleAvatarChange('age_range', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Gender Identity</label>
                                    <input
                                        className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                        placeholder="e.g. Female"
                                        value={profile.gender || ''}
                                        onChange={(e) => handleAvatarChange('gender', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Primary Location</label>
                                    <input
                                        className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                        placeholder="e.g. London / Remote"
                                        value={profile.location || ''}
                                        onChange={(e) => handleAvatarChange('location', e.target.value)}
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
                                        onChange={(e) => handleAvatarChange('net_worth', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Spending Habits</label>
                                    <input
                                        className="w-full border-b-2 border-black/10 focus:border-black py-3 text-xl outline-none transition-colors bg-transparent"
                                        placeholder="e.g. Luxury Conscious"
                                        value={profile.spending_power || ''}
                                        onChange={(e) => handleAvatarChange('spending_power', e.target.value)}
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
                                        onChange={(e) => handleAvatarChange('key_interests', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Core Life Goals</label>
                                    <textarea
                                        className="w-full border-2 border-black/5 rounded-xl p-4 text-lg outline-none focus:border-black transition-colors min-h-[100px]"
                                        placeholder="What is their 5-year vision?"
                                        value={profile.goals || ''}
                                        onChange={(e) => handleAvatarChange('goals', e.target.value)}
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
                                    onChange={(e) => handleAvatarChange('pain_points', e.target.value)}
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
                        onClick={prevStep}
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
                            onClick={nextStep}
                            className="bg-black text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl hover:opacity-80 shadow-lg active:scale-95 transition-all"
                        >
                            Continue <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => alert("Avatar DNA locked and loaded.")}
                            className="bg-green-600 text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-green-700 shadow-lg active:scale-95 transition-all"
                        >
                            Finish Build <Check size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
