import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { generateMoodboardPrompts, generateBrandStrategy } from '../services/geminiService';
import { uploadAsset } from '../services/storageService';
import { Loader2, Copy, Upload, Image as ImageIcon, Ruler, Type as TypeIcon, Palette as PaletteIcon, CheckCircle2, AlertOctagon, Star, Crown, ChevronDown, Plus, Trash2, Search, Zap, Info, Layers, Sparkles, Wand2, X } from 'lucide-react';
import { BrandIdentity, StrategySectionType } from '../types';

// Massive Font List for Visual Picker
const GOOGLE_FONTS_LIBRARY = [
    { name: 'Cormorant Garamond', category: 'Serif' },
    { name: 'Playfair Display', category: 'Serif' },
    { name: 'Merriweather', category: 'Serif' },
    { name: 'Lora', category: 'Serif' },
    { name: 'PT Serif', category: 'Serif' },
    { name: 'Bodoni Moda', category: 'Serif' },
    { name: 'Cinzel', category: 'Serif' },
    { name: 'Prata', category: 'Serif' },
    { name: 'Italiana', category: 'Serif' },
    { name: 'Libre Baskerville', category: 'Serif' },
    { name: 'EB Garamond', category: 'Serif' },
    { name: 'Noto Serif', category: 'Serif' },
    { name: 'Old Standard TT', category: 'Serif' },
    { name: 'Vollkorn', category: 'Serif' },

    { name: 'Inter', category: 'Sans' },
    { name: 'Montserrat', category: 'Sans' },
    { name: 'Roboto', category: 'Sans' },
    { name: 'Open Sans', category: 'Sans' },
    { name: 'Lato', category: 'Sans' },
    { name: 'Poppins', category: 'Sans' },
    { name: 'Raleway', category: 'Sans' },
    { name: 'Nunito', category: 'Sans' },
    { name: 'Work Sans', category: 'Sans' },
    { name: 'Rubik', category: 'Sans' },
    { name: 'Quicksand', category: 'Sans' },
    { name: 'Barlow', category: 'Sans' },
    { name: 'Syne', category: 'Sans' },
    { name: 'Tenor Sans', category: 'Sans' },
    { name: 'Manrope', category: 'Sans' },
    { name: 'DM Sans', category: 'Sans' },
    { name: 'Josefin Sans', category: 'Sans' },
    { name: 'Space Mono', category: 'Display' },

    { name: 'Oswald', category: 'Display' },
    { name: 'Bebas Neue', category: 'Display' },
    { name: 'Abril Fatface', category: 'Display' },
    { name: 'Alfa Slab One', category: 'Display' },
    { name: 'Passion One', category: 'Display' },
    { name: 'Fjalla One', category: 'Display' },

    { name: 'Dancing Script', category: 'Handwriting' },
    { name: 'Pacifico', category: 'Handwriting' },
    { name: 'Caveat', category: 'Handwriting' },
    { name: 'Satisfy', category: 'Handwriting' },
    { name: 'Great Vibes', category: 'Handwriting' },
    { name: 'Sacramento', category: 'Handwriting' },
    { name: 'Parisienne', category: 'Handwriting' },
    { name: 'Pinyon Script', category: 'Handwriting' },
];

const LUXURY_PRESETS = [
    {
        name: 'Bulgari Style',
        icon: <Star size={16} />,
        description: 'Roman Opulence',
        data: {
            font_heading: 'Cinzel',
            font_body: 'Lato',
            logo_rules: 'Center aligned. Minimalist. Requires wide clear space. Gold or Black only.',
            typography_rules: 'Use Roman Capitals for headings. Wide tracking (letter-spacing).',
            logo_donts: 'Do not use shadows. Do not tilt. Do not use outline strokes.',
            rules_dos: ['Use ALL CAPS for top-level headers', 'Use serifs for elegance', 'Maintain wide letter spacing', 'Use architectural symmetry'],
            rules_donts: ['Avoid rounded sans-serifs', 'Avoid neon colors', 'Do not use drop shadows', 'Avoid clutter'],
            do_nots: 'Avoid rounded sans-serifs. Avoid neon colors. Do not use drop shadows.',
            color_primary_hex: '#ffffff',
            color_secondary_hex: '#000000',
            color_accent_hex: '#D4AF37', // Gold
            color_palette_description: 'A base of stark white and deep black, punctuated by rich metallic gold and architectural greys.',
            image_style: 'High contrast, dramatic lighting, gold accents, marble textures, architectural backgrounds, Italian heritage cues.'
        }
    },
    {
        name: 'Dior Style',
        icon: <Crown size={16} />,
        description: 'French Elegance',
        data: {
            font_heading: 'Bodoni Moda',
            font_body: 'Inter',
            logo_rules: 'Clean serif logotype. Black on White predominantly.',
            typography_rules: 'High contrast serifs for headings. Clean sans-serif for utility.',
            logo_donts: 'Never alter the letter spacing of the logo. No gradients.',
            rules_dos: ['Use large font sizes for impact', 'Keep layouts airy and white', 'Use high-fashion photography', 'Floral motifs allowed'],
            rules_donts: ['Do not crowd text', 'Do not use decorative script fonts', 'Avoid busy backgrounds', 'No heavy borders'],
            do_nots: 'Do not crowd text. Do not use decorative script fonts. Avoid busy backgrounds.',
            color_primary_hex: '#FFFFFF',
            color_secondary_hex: '#F5F5F5',
            color_accent_hex: '#000000',
            color_palette_description: 'Monochromatic grays and whites (Dior Grey), allowing the product to provide the color.',
            image_style: 'Floral settings, soft greys and whites, studio lighting, elegant poses, "The New Look" silhouette.'
        }
    },
    {
        name: 'Hermes Style',
        icon: <Star size={16} />,
        description: 'Artisanal Warmth',
        data: {
            font_heading: 'Cormorant Garamond',
            font_body: 'Montserrat',
            logo_rules: 'Iconic carriage logo must accompany text. Signature Orange is mandatory.',
            typography_rules: 'Slab serifs or strong serifs. Traditional yet bold.',
            logo_donts: 'Do not change the specific orange shade. Do not separate icon from text improperly.',
            rules_dos: ['Use the signature orange for accents', 'Maintain classical proportions', 'Use leather textures', 'Focus on craftsmanship'],
            rules_donts: ['Avoid futuristic fonts', 'Avoid cluttered backgrounds', 'Do not use blue or purple'],
            do_nots: 'Avoid futuristic fonts. Avoid cluttered backgrounds. Do not use blue or purple.',
            color_primary_hex: '#F3F3F3',
            color_secondary_hex: '#111111',
            color_accent_hex: '#F37021', // Hermes Orange
            color_palette_description: 'Warm earth tones, beige, and brown, anchored by the signature Hermès Orange.',
            image_style: 'Equestrian themes, warm sunlight, natural leather textures, artisanal details, playful surrealism.'
        }
    },
    {
        name: 'Chanel Style',
        icon: <Crown size={16} />,
        description: 'Timeless Mono',
        data: {
            font_heading: 'Montserrat',
            font_body: 'Inter',
            logo_rules: 'Interlocking Cs. Stark Black and White only.',
            typography_rules: 'Uppercase Geometric Sans-Serif. Bold and Direct.',
            logo_donts: 'No colors other than B&W. No effects.',
            rules_dos: ['Strict grid alignment', 'Minimal text', 'Black borders', 'Quilted textures'],
            rules_donts: ['No italics', 'No handwriting fonts', 'No colors in UI', 'No gradients'],
            do_nots: 'No italics. No handwriting fonts. No colors in UI.',
            color_primary_hex: '#FFFFFF',
            color_secondary_hex: '#000000',
            color_accent_hex: '#333333',
            color_palette_description: 'Strict Black & White. Beige is the only allowed accent.',
            image_style: 'Black and white photography, pearls, tweed textures, quilted patterns, camellia flowers.'
        }
    },
    {
        name: 'Rolex Style',
        icon: <Star size={16} />,
        description: 'Executive Power',
        data: {
            font_heading: 'Cormorant Garamond',
            font_body: 'Lato',
            logo_rules: 'Crown icon is sacred. Green and Gold palette.',
            typography_rules: 'Serif headings for heritage. Clean sans for technical specs.',
            logo_donts: 'Do not distort the crown. Do not change the green.',
            rules_dos: ['Use gold gradients for text overlays', 'Use dark green backgrounds', 'Showcase precision', 'Macro photography'],
            rules_donts: ['No comic or casual fonts', 'Do not crop the product', 'Avoid distressed textures'],
            do_nots: 'No comic or casual fonts. Do not crop the product.',
            color_primary_hex: '#F0F0F0',
            color_secondary_hex: '#006039', // Rolex Green
            color_accent_hex: '#A37E2C', // Gold
            color_palette_description: 'Metallic Gold, Steel Silver, and Deep Forest Green.',
            image_style: 'Precision macro shots, green velvet, gold reflections, success and achievement themes, tennis/golf/sailing contexts.'
        }
    }
];

const FontPicker = ({ currentFont, onClose, onSelect }: { currentFont: string, onClose: () => void, onSelect: (f: string) => void }) => {
    const [search, setSearch] = useState("");
    const filteredFonts = GOOGLE_FONTS_LIBRARY.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="absolute top-full left-0 w-full bg-white border border-black/10 shadow-xl rounded-xl z-50 mt-2 max-h-[400px] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-black/5 bg-gray-50">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:border-black"
                        placeholder="Search 200+ fonts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
                {filteredFonts.map(font => (
                    <div
                        key={font.name}
                        onClick={() => {
                            onSelect(font.name);
                            onClose();
                        }}
                        className={`p-3 rounded-lg hover:bg-black/5 cursor-pointer flex justify-between items-center group ${currentFont === font.name ? 'bg-black/5' : ''}`}
                    >
                        <div>
                            <span className="text-xl" style={{ fontFamily: font.name }}>{font.name}</span>
                            <p className="text-[10px] text-gray-400">{font.category}</p>
                        </div>
                        {currentFont === font.name && <CheckCircle2 size={16} className="text-green-600" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Identity: React.FC = () => {
    const { brands, activeBrandId, identities, updateIdentity, addAsset, strategySections, updateStrategySection, updateBrand } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [prompts, setPrompts] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moodboardInputRef = useRef<HTMLInputElement>(null);

    const [openFontPicker, setOpenFontPicker] = useState<'heading' | 'body' | null>(null);
    const [activeMoodboardIndex, setActiveMoodboardIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'strategy' | 'visuals' | 'debug'>('strategy');
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
        console.log(`[DEBUG] ${msg}`);
    };

    const activeBrand = brands.find(b => b.id === activeBrandId);
    const identity = identities.find(i => i.brand_id === activeBrandId);

    if (!activeBrand || !identity) return <div>Loading...</div>;

    const handleChange = (field: keyof BrandIdentity, value: any) => {
        updateIdentity({ ...identity, [field]: value });
    };

    const applyPreset = (presetData: any) => {
        updateIdentity({ ...identity, ...presetData });
        const button = document.activeElement as HTMLElement;
        if (button) {
            button.classList.add('ring-2', 'ring-green-500');
            setTimeout(() => button.classList.remove('ring-2', 'ring-green-500'), 500);
        }
    };

    const handleGeneratePrompts = async () => {
        if (!identity.image_style) return alert("Please describe an image style first.");
        setLoading(true);
        try {
            const results = await generateMoodboardPrompts(activeBrand, identity.image_style);
            setPrompts(results);
        } catch (e) {
            alert("Failed to generate");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStrategy = async () => {
        setLoading(true);
        try {
            const result = await generateBrandStrategy(activeBrand, []);
            if (result.mission) handleStrategyUpdate(StrategySectionType.Mission, result.mission);
            if (result.vision) handleStrategyUpdate(StrategySectionType.Vision, result.vision);
            if (result.tone_of_voice) handleStrategyUpdate(StrategySectionType.ToneOfVoice, result.tone_of_voice);
            if (result.values) handleValuesUpdate(result.values);
            else if (result.five_pillars) handleValuesUpdate(result.five_pillars);
            alert("Strategy Generated Successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to generate strategy.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLoading(true);
            try {
                addLog(`Starting upload for: ${file.name} (Size: ${file.size})`);
                const publicUrl = await uploadAsset(file, activeBrand.id, 'identity');
                addLog(`Upload success. URL: ${publicUrl}`);

                if (publicUrl) {
                    updateIdentity({ ...identity, logo_primary_url: publicUrl });
                    addAsset({
                        id: crypto.randomUUID(),
                        brand_id: activeBrand.id,
                        asset_type: 'logo',
                        title: file.name,
                        description: 'Primary Brand Logo',
                        file_url: publicUrl,
                        tags: ['logo', 'branding', 'identity']
                    });
                    addLog("Identity updated and Asset added to DB.");
                }
            } catch (error: any) {
                addLog(`ERROR: ${error.message || JSON.stringify(error)}`);
                console.error("Logo upload failed", error);
                alert("Failed to upload logo: " + (error.message || "Unknown error"));
            } finally {
                setLoading(false);
                // Reset input so same file can be selected again
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleMoodboardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeMoodboardIndex !== null) {
            const file = e.target.files[0];
            setLoading(true);
            try {
                const publicUrl = await uploadAsset(file, activeBrand.id, 'moodboard');

                if (publicUrl) {
                    const currentImages = [...(identity.brand_book_config?.moodboard_images || [])];
                    while (currentImages.length <= activeMoodboardIndex) currentImages.push('');
                    currentImages[activeMoodboardIndex] = publicUrl;

                    updateIdentity({
                        ...identity,
                        brand_book_config: {
                            ...identity.brand_book_config,
                            moodboard_images: currentImages
                        }
                    });

                    addAsset({
                        id: crypto.randomUUID(),
                        brand_id: activeBrand.id,
                        asset_type: 'image',
                        title: file.name,
                        description: 'Moodboard Image',
                        file_url: publicUrl,
                        tags: ['moodboard']
                    });
                    setActiveMoodboardIndex(null);
                }
            } catch (error) {
                console.error("Moodboard upload failed", error);
                alert("Failed to upload image.");
            } finally {
                setLoading(false);
            }
        }
    };

    const addRule = (type: 'rules_dos' | 'rules_donts') => {
        const current = identity[type] || [];
        updateIdentity({ ...identity, [type]: [...current, "New Rule"] });
    };

    const updateRule = (type: 'rules_dos' | 'rules_donts', index: number, value: string) => {
        const current = [...(identity[type] || [])];
        current[index] = value;
        updateIdentity({ ...identity, [type]: current });
    };

    const removeRule = (type: 'rules_dos' | 'rules_donts', index: number) => {
        const current = [...(identity[type] || [])];
        current.splice(index, 1);
        updateIdentity({ ...identity, [type]: current });
    };

    const addColor = () => {
        const current = identity.extra_colors || [];
        updateIdentity({ ...identity, extra_colors: [...current, { name: 'New Color', hex: '#000000', usage: 'Accent' }] });
    };

    const updateColor = (index: number, field: string, value: string) => {
        const current = [...(identity.extra_colors || [])];
        current[index] = { ...current[index], [field]: value };
        updateIdentity({ ...identity, extra_colors: current });
    };

    const removeColor = (index: number) => {
        const current = [...(identity.extra_colors || [])];
        current.splice(index, 1);
        updateIdentity({ ...identity, extra_colors: current });
    };

    const getStrategyContent = (type: StrategySectionType) => {
        const section = strategySections.find(s => s.brand_id === activeBrandId && s.section_type === type);
        return section?.content || "";
    };

    const handleStrategyUpdate = (type: StrategySectionType, value: string) => {
        const section = strategySections.find(s => s.brand_id === activeBrandId && s.section_type === type);
        if (section) {
            // Fix: updateStrategySection expects string content, not object
            updateStrategySection(section.id, value);
        } else {
            // Placeholder for creation logic
        }
    };

    const handleValuesUpdate = (value: string) => {
        updateBrand(activeBrandId, { values: value });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto pb-40">
            <div className="flex items-center gap-6 mb-10 pb-8 border-b border-black/5">
                {identity.logo_primary_url && (
                    <img src={identity.logo_primary_url} alt="Brand Logo" className="h-20 w-auto max-w-[150px] object-contain" />
                )}
                <div>
                    <h1 className="text-4xl font-bold font-serif-brand">Identity Hub</h1>
                    <p className="opacity-60 text-lg">Definitive Brand Guidelines for {activeBrand.name}.</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-8 border-b border-black/10 mb-8">
                <button
                    onClick={() => setActiveTab('strategy')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'strategy' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
                >
                    Strategy Layer
                </button>
                <button
                    onClick={() => setActiveTab('visuals')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'visuals' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
                >
                    Visual Identity
                </button>
                <button
                    onClick={() => setActiveTab('debug')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'debug' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                    Debug Console
                </button>
            </div>

            {/* ======================= */}
            {/* CORE STRATEGY VIEW      */}
            {/* ======================= */}
            {activeTab === 'strategy' && (
                <div className="grid grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* LEFT COLUMN: ARCHITECTURE */}
                    <div className="col-span-4 space-y-8">
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-black"></span>
                                Core DNA
                            </h3>
                            <div className="bg-gray-50 p-6 rounded-none space-y-6 border border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Mission Statement</label>
                                    <textarea
                                        className="w-full bg-transparent border-0 border-b border-black/10 focus:border-black focus:ring-0 p-0 text-lg font-serif-brand leading-relaxed resize-none placeholder-gray-300"
                                        rows={4}
                                        placeholder="Our mission is to..."
                                        value={getStrategyContent(StrategySectionType.Mission)}
                                        onChange={(e) => handleStrategyUpdate(StrategySectionType.Mission, e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Vision</label>
                                    <textarea
                                        className="w-full bg-transparent border-0 border-b border-black/10 focus:border-black focus:ring-0 p-0 text-sm leading-relaxed resize-none placeholder-gray-300"
                                        rows={3}
                                        placeholder="We envision a world where..."
                                        value={getStrategyContent(StrategySectionType.Vision)}
                                        onChange={(e) => handleStrategyUpdate(StrategySectionType.Vision, e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-black"></span>
                                Brand Values
                            </h3>
                            <div className="p-6 border border-black/10">
                                <textarea
                                    className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm leading-relaxed resize-none"
                                    rows={6}
                                    placeholder="List your core values..."
                                    value={activeBrand.values || ''}
                                    onChange={(e) => handleValuesUpdate(e.target.value)}
                                />
                            </div>
                        </section>

                        <button
                            onClick={handleGenerateStrategy}
                            disabled={loading}
                            className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            Auto-Generate Strategy
                        </button>
                    </div>

                    {/* RIGHT COLUMN: GUIDELINES */}
                    <div className="col-span-8 space-y-12">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-6 border border-black/5 bg-white shadow-sm">
                                <h4 className="font-serif-brand text-2xl mb-4 text-gray-900">Tone of Voice</h4>
                                <textarea
                                    className="w-full bg-transparent border-0 text-gray-600 leading-relaxed focus:ring-0 resize-none h-40"
                                    placeholder="Describe how your brand speaks..."
                                    value={getStrategyContent(StrategySectionType.ToneOfVoice)}
                                    onChange={(e) => handleStrategyUpdate(StrategySectionType.ToneOfVoice, e.target.value)}
                                />
                            </div>
                            <div className="p-6 border border-black/5 bg-white shadow-sm">
                                <h4 className="font-serif-brand text-2xl mb-4 text-gray-900">Brand Archetype</h4>
                                <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-100 text-gray-300">
                                    <span className="text-xs uppercase tracking-widest">Archetype Wheel Chart</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================= */}
            {/* VISUAL IDENTITY VIEW    */}
            {/* ======================= */}
            {activeTab === 'visuals' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">

                    {/* LOGO & PALETTE SECTION */}
                    <div className="grid grid-cols-12 gap-12">
                        <div className="col-span-5">
                            <h3 className="section-title mb-6">Logomark</h3>
                            <div className="aspect-square bg-white border border-black/10 flex items-center justify-center relative group cursor-pointer mb-4 overflow-hidden"
                                onClick={() => !loading && fileInputRef.current?.click()}>
                                {loading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-black" size={24} />
                                        <span className="text-xs uppercase tracking-widest text-black/50">Uploading...</span>
                                    </div>
                                ) : identity.logo_primary_url ? (
                                    <img src={identity.logo_primary_url} className="w-2/3 object-contain" />
                                ) : (
                                    <span className="text-gray-300 text-sm font-medium">Upload Primary Logo</span>
                                )}
                                {!loading && (
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="bg-white px-4 py-2 text-xs font-bold shadow-sm">CHANGE</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} disabled={loading} />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-xs">Restricted Areas</label>
                                    <textarea
                                        value={identity.do_nots || ''}
                                        onChange={(e) => handleChange('do_nots', e.target.value)}
                                        className="input-underlined w-full h-20"
                                        placeholder="e.g. Do not rotate..."
                                    />
                                </div>
                                <div>
                                    <label className="label-xs">Clear Space</label>
                                    <textarea
                                        value={identity.logo_rules || ''}
                                        onChange={(e) => handleChange('logo_rules', e.target.value)}
                                        className="input-underlined w-full h-20"
                                        placeholder="e.g. 50% height..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-7">
                            <h3 className="section-title mb-6">Color System</h3>
                            <div className="flex gap-6 mb-8">
                                <div className="space-y-3">
                                    <div className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white" style={{ backgroundColor: identity.color_primary_hex }}></div>
                                    <input
                                        value={identity.color_primary_hex}
                                        onChange={(e) => handleChange('color_primary_hex', e.target.value)}
                                        className="block w-24 text-center font-mono text-xs border-none bg-transparent focus:ring-0"
                                    />
                                    <label className="block text-center text-[10px] items-center uppercase tracking-widest opacity-50">Primary</label>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white" style={{ backgroundColor: identity.color_secondary_hex }}></div>
                                    <input
                                        value={identity.color_secondary_hex}
                                        onChange={(e) => handleChange('color_secondary_hex', e.target.value)}
                                        className="block w-24 text-center font-mono text-xs border-none bg-transparent focus:ring-0"
                                    />
                                    <label className="block text-center text-[10px] items-center uppercase tracking-widest opacity-50">Secondary</label>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white" style={{ backgroundColor: identity.color_accent_hex }}></div>
                                    <input
                                        value={identity.color_accent_hex}
                                        onChange={(e) => handleChange('color_accent_hex', e.target.value)}
                                        className="block w-24 text-center font-mono text-xs border-none bg-transparent focus:ring-0"
                                    />
                                    <label className="block text-center text-[10px] items-center uppercase tracking-widest opacity-50">Accent</label>
                                </div>
                            </div>

                            <div className="border-t border-black/5 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="label-xs">Extended Palette</label>
                                    <button onClick={addColor} className="text-[10px] font-bold uppercase tracking-wider text-black hover:opacity-60 flex items-center gap-1"><Plus size={10} /> Add Color</button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {identity.extra_colors?.map((color, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 border border-dashed border-gray-200 group relative">
                                            <div className="w-8 h-8 rounded-full shadow-sm shrink-0 cursor-pointer border border-black/5" style={{ backgroundColor: color.hex }}>
                                                <input
                                                    type="color"
                                                    className="opacity-0 w-full h-full cursor-pointer"
                                                    value={color.hex}
                                                    onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <input
                                                    value={color.name}
                                                    onChange={(e) => updateColor(idx, 'name', e.target.value)}
                                                    className="w-full text-xs font-bold border-none p-0 focus:ring-0 bg-transparent truncate"
                                                />
                                                <input
                                                    value={color.usage}
                                                    onChange={(e) => updateColor(idx, 'usage', e.target.value)}
                                                    className="w-full text-[10px] opacity-50 border-none p-0 focus:ring-0 bg-transparent truncate"
                                                />
                                            </div>
                                            <button onClick={() => removeColor(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* TYPOGRAPHY */}
                    <section>
                        <h3 className="section-title mb-8">Typography</h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <label className="label-xs">Heading Font</label>
                                    <div className="relative">
                                        <button onClick={() => setOpenFontPicker(openFontPicker === 'heading' ? null : 'heading')} className="text-xs font-bold border-b border-black flex items-center gap-1">
                                            Change <ChevronDown size={10} />
                                        </button>
                                        {openFontPicker === 'heading' && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl border border-black/10 max-h-60 overflow-y-auto z-10">
                                                {GOOGLE_FONTS_LIBRARY.map(f => (
                                                    <div key={f.name} className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer" onClick={() => { handleChange('font_heading', f.name); setOpenFontPicker(null); }}>
                                                        {f.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 border border-black/5 bg-gray-50/50">
                                    <h1 className="text-5xl mb-4 font-serif-brand leading-tight">
                                        The quick brown fox jumps over the lazy dog.
                                    </h1>
                                    <p className="opacity-50 text-xs uppercase tracking-widest">{identity.font_heading}</p>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <label className="label-xs">Body Font</label>
                                    <div className="relative">
                                        <button onClick={() => setOpenFontPicker(openFontPicker === 'body' ? null : 'body')} className="text-xs font-bold border-b border-black flex items-center gap-1">
                                            Change <ChevronDown size={10} />
                                        </button>
                                        {openFontPicker === 'body' && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl border border-black/10 max-h-60 overflow-y-auto z-10">
                                                {GOOGLE_FONTS_LIBRARY.map(f => (
                                                    <div key={f.name} className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer" onClick={() => { handleChange('font_body', f.name); setOpenFontPicker(null); }}>
                                                        {f.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 border border-black/5 bg-gray-50/50">
                                    <p className="text-lg leading-relaxed max-w-md">
                                        Design determines how your brand is perceived. Every curve, color, and font tells a story.
                                        Make sure it's the one you want to tell.
                                    </p>
                                    <p className="mt-4 opacity-50 text-xs uppercase tracking-widest">{identity.font_body}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-black/5" />

                    {/* MOODBOARD */}
                    <section>
                        <div className="flex justify-between items-end mb-8">
                            <h3 className="section-title">Visual Moodboard</h3>
                            <button onClick={handleGeneratePrompts} className="btn-secondary flex items-center gap-2">
                                <Wand2 size={14} /> AI Generate Ideas
                            </button>
                        </div>

                        {prompts.length > 0 && (
                            <div className="mb-8 p-4 bg-gray-50 border border-black/5">
                                <h5 className="font-bold text-xs uppercase mb-2">AI Suggestions</h5>
                                <div className="flex flex-wrap gap-2">
                                    {prompts.map((p, i) => (
                                        <span key={i} className="px-2 py-1 bg-white border border-black/5 text-[10px] rounded">{p}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            {/* Standard Grid of 6 Images */}
                            {(identity.brand_book_config?.moodboard_images || ['', '', '', '', '', '']).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="aspect-[3/4] bg-gray-100 relative group overflow-hidden cursor-pointer"
                                    onClick={() => { setActiveMoodboardIndex(idx); moodboardInputRef.current?.click(); }}
                                >
                                    {url ? (
                                        <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white text-xs font-bold uppercase tracking-widest border border-white px-3 py-1">Replace</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <input type="file" ref={moodboardInputRef} className="hidden" onChange={handleMoodboardUpload} />
                    </section>

                    {/* PRESETS CHEAT SHEET */}
                    <section className="bg-gray-900 text-white p-8 rounded-xl mt-20">
                        <h3 className="text-xl font-serif-brand mb-6">Luxury Standard Presets</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {LUXURY_PRESETS.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyPreset(preset.data)}
                                    className="text-left p-4 bg-white/10 hover:bg-white/20 transition-colors rounded-lg group"
                                >
                                    <div className="mb-2 opacity-50 group-hover:text-amber-400 transition-colors">{preset.icon}</div>
                                    <div className="font-bold text-sm mb-1">{preset.name}</div>
                                    <div className="text-[10px] opacity-60">{preset.description}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                </div>
            )}

            {activeTab === 'debug' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-2 gap-8">
                    <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-xs h-[500px] overflow-y-auto shadow-2xl">
                        <h3 className="text-white mb-4 border-b border-white/20 pb-2 uppercase tracking-widest font-bold flex justify-between">
                            Console Logs
                            <button onClick={() => setDebugLogs([])} className="text-gray-500 hover:text-white">CLEAR</button>
                        </h3>
                        <div className="space-y-2">
                            {debugLogs.length === 0 && <span className="opacity-50 italic">Waiting for activity...</span>}
                            {debugLogs.map((log, i) => (
                                <div key={i} className="border-l-2 border-green-900 pl-2 hover:bg-white/5 py-1">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-lg text-xs font-mono h-[500px] overflow-y-auto">
                        <h3 className="mb-4 border-b border-black/10 pb-2 uppercase tracking-widest font-bold text-gray-500">Current Identity State</h3>
                        <pre className="whitespace-pre-wrap text-gray-700">
                            {JSON.stringify(identity, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
