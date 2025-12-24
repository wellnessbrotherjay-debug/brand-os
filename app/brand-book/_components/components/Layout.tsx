import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { ViewName } from '../types';
import { LayoutDashboard, Wand2, PenTool, Palette, FolderOpen, Lightbulb, Calendar, BookOpen, Image, Hotel, ShoppingBag, PieChart, Utensils, ChevronDown, Settings, Database, Edit2, Link2, CheckSquare, BarChart3, Users, BrainCircuit, Target, LayoutTemplate, Megaphone, UserPlus, Box, Sparkles, Film } from 'lucide-react';

interface LayoutProps {
    currentView: ViewName;
    setView: (view: ViewName) => void;
    children: React.ReactNode;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    accentColor?: string;
    textColor?: string;
}> = ({ icon, label, isActive, onClick, accentColor, textColor }) => (
    <button
        onClick={onClick}
        style={{
            backgroundColor: isActive ? (accentColor || '#e0e7ff') : 'transparent',
            color: isActive ? (textColor || '#4338ca') : 'inherit'
        }}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors opacity-90 hover:opacity-100 hover:bg-black/5`}
    >
        <span className="mr-3">{icon}</span>
        {label}
    </button>
);

// --- GLOBAL FONT ENGINE ---
// Injects styles dynamically based on the active identity
const GlobalFontManager: React.FC = () => {
    const { activeBrandId, identities } = useAppStore();
    const identity = identities.find(i => i.brand_id === activeBrandId);

    useEffect(() => {
        if (!identity) return;

        // 1. Determine Font Families
        const headingFont = identity.font_heading || 'Cormorant Garamond';
        const bodyFont = identity.font_body || 'Inter';

        // 2. Generate Font Faces for Custom Uploads
        let customFontCss = '';

        if (identity.font_heading_custom_url) {
            customFontCss += `
@font-face {
    font-family: '${headingFont}';
    src: url('${identity.font_heading_custom_url}') format('truetype');
    font-weight: normal;
    font-style: normal;
}
`;
        } else {
            // Load from Google Fonts if not custom
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        if (identity.font_body_custom_url) {
            customFontCss += `
                @font-face {
                    font-family: '${bodyFont}';
                    src: url('${identity.font_body_custom_url}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
            `;
        } else {
            // Load from Google Fonts if not custom
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // 3. Inject CSS Variables & Overrides
        const styleId = 'dynamic-brand-fonts';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            ${customFontCss}
            :root {
                --font-heading: '${headingFont}', serif;
                --font-body: '${bodyFont}', sans-serif;
            }
            .font-serif-brand { font-family: var(--font-heading) !important; }
            body, .font-sans { font-family: var(--font-body) !important; }
        `;

        return () => {
            // cleanup if needed, though usually we want persistence
        }
    }, [identity?.font_heading, identity?.font_body, identity?.font_heading_custom_url, identity?.font_body_custom_url]);

    return null;
};

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
    const { brands, activeBrandId, setActiveBrand, identities, currentUser, setCurrentUser } = useAppStore();
    const [appMode, setAppMode] = React.useState<'brand' | 'hospitality'>('brand');

    const currentIdentity = identities.find(i => i.brand_id === activeBrandId);
    const activeBrand = brands.find(b => b.id === activeBrandId);

    // --- DYNAMIC THEME LOGIC ---
    const uiConfig = currentIdentity?.ui_config || { use_identity_theme: true };
    const customColors = uiConfig.custom_colors;

    // --- PROFESSIONAL LIGHT THEME (Restored) ---
    // User requested original background. We ensure text is dark for contrast.
    const bgPrimary = '#f8fafc'; // Slate 50
    const bgSidebar = '#ffffff'; // White
    const textPrimary = '#1e293b'; // Slate 800 (Dark)

    // Use brand color ONLY for accents/buttons
    const accentColor = currentIdentity?.color_accent_hex || currentIdentity?.color_primary_hex || '#00bfff';
    const accentBg = `${accentColor}15`;

    return (
        <div
            className="flex h-[calc(100vh-5rem)] overflow-hidden transition-colors duration-500 font-sans"
            style={{ backgroundColor: bgPrimary, color: textPrimary }}
        >
            <GlobalFontManager />
            <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
            {/* Sidebar */}
            <aside
                className="w-64 border-r flex flex-col shadow-sm z-10 backdrop-blur-sm transition-colors duration-500"
                style={{
                    backgroundColor: bgSidebar,
                    borderColor: `${textPrimary}20`
                }}
            >
                <div className="p-6 border-b" style={{ borderColor: `${textPrimary}10` }}>
                    {/* Main App Title */}
                    <div className="mb-6">
                        <h1 className="font-serif-brand text-2xl font-bold leading-none tracking-tight">
                            Hotel Solutions<br />Brand OS
                        </h1>
                        <p className="text-[10px] opacity-50 uppercase tracking-widest mt-1">Multi-Brand System</p>
                    </div>

                    {/* Identity Selector */}
                    <div className="mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">Active Identity</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                {activeBrand && currentIdentity ? (
                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: accentColor }}></div>
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                )}
                            </div>
                            <select
                                value={activeBrandId || ''}
                                onChange={(e) => {
                                    if (e.target.value === 'new') {
                                        setView('setup');
                                    } else {
                                        setActiveBrand(e.target.value);
                                    }
                                }}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.4)',
                                    color: textPrimary,
                                    borderColor: `${textPrimary}20`
                                }}
                                className="w-full appearance-none border text-sm rounded-lg py-2.5 pl-8 pr-8 focus:outline-none focus:ring-2 focus:ring-black/5 hover:bg-white/60 transition-colors font-bold cursor-pointer shadow-sm"
                            >
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="new">+ Create Identity</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center opacity-50">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Edit Link */}
                    <button
                        onClick={() => setView('identity')}
                        className="flex items-center gap-1.5 text-[10px] font-medium opacity-50 hover:opacity-100 transition-opacity mb-4 uppercase tracking-wider"
                    >
                        <Edit2 size={10} />
                        Edit {activeBrand?.name} Identity
                    </button>

                    {/* Workspace Switcher */}
                    <div className="mt-4 flex p-1 bg-black/5 rounded-lg">
                        <button
                            onClick={() => setAppMode('brand')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${appMode === 'brand' ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-80'}`}
                        >
                            Strategy
                        </button>
                        {currentUser?.role !== 'Designer' && (
                            <button
                                onClick={() => setAppMode('hospitality')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${appMode === 'hospitality' ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-80'}`}
                            >
                                Operations
                            </button>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {appMode === 'brand' ? (
                        <>
                            <NavItem
                                icon={<LayoutDashboard size={20} />}
                                label="Dashboard"
                                isActive={currentView === 'dashboard'}
                                onClick={() => setView('dashboard')}
                                accentColor={accentBg}
                                textColor={textPrimary}
                            />

                            {/* Brand & Strategy Group */}
                            <div className="pt-2 mt-2 mb-2">
                                <NavItem
                                    icon={<Database size={20} />}
                                    label="Brand Origin"
                                    isActive={currentView === 'brand_master'}
                                    onClick={() => setView('brand_master')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Palette size={20} />}
                                    label="Identity Hub"
                                    isActive={currentView === 'identity'}
                                    onClick={() => setView('identity')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Users size={20} />}
                                    label="Customer Avatar"
                                    isActive={currentView === 'customer_avatar'}
                                    onClick={() => setView('customer_avatar')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<BrainCircuit size={20} />}
                                    label="LLM Settings"
                                    isActive={currentView === 'llm_settings'}
                                    onClick={() => setView('llm_settings')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                            </div>

                            {/* Workspace Group */}
                            <div className="pt-4 mt-4 border-t" style={{ borderColor: `${textPrimary}10` }}>
                                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider mb-2 opacity-50">Workspace</h3>
                                <NavItem
                                    icon={<Box size={20} />}
                                    label="Pods"
                                    isActive={currentView === 'pods'}
                                    onClick={() => setView('pods')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<FolderOpen size={20} />}
                                    label="Projects Board"
                                    isActive={currentView === 'projects'}
                                    onClick={() => setView('projects')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Image size={20} />}
                                    label="Projects & Assets"
                                    isActive={currentView === 'assets'}
                                    onClick={() => setView('assets')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Sparkles size={20} />}
                                    label="Creative Studio"
                                    isActive={currentView === 'creative_board'}
                                    onClick={() => setView('creative_board')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Film size={20} />}
                                    label="Video Factory"
                                    isActive={currentView === 'video_studio'}
                                    onClick={() => setView('video_studio')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<UserPlus size={20} />}
                                    label="Team & Access"
                                    isActive={currentView === 'team'}
                                    onClick={() => setView('team')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Target size={20} />}
                                    label="Marketing Strategy"
                                    isActive={currentView === 'marketing_strategy'}
                                    onClick={() => setView('marketing_strategy')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Link2 size={20} />}
                                    label="Integrations"
                                    isActive={currentView === 'integrations'}
                                    onClick={() => setView('integrations')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                            </div>

                            {/* Content Engine Group */}
                            <div className="pt-4 mt-4 border-t" style={{ borderColor: `${textPrimary}10` }}>
                                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider mb-2 opacity-50">Content Engine</h3>
                                <NavItem
                                    icon={<Lightbulb size={20} />}
                                    label="Idea Generator"
                                    isActive={currentView === 'ideas'}
                                    onClick={() => setView('ideas')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<LayoutTemplate size={20} />}
                                    label="Template Studio"
                                    isActive={currentView === 'template_studio'}
                                    onClick={() => setView('template_studio')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Calendar size={20} />}
                                    label="Calendar"
                                    isActive={currentView === 'calendar'}
                                    onClick={() => setView('calendar')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<CheckSquare size={20} />}
                                    label="Approvals"
                                    isActive={currentView === 'approvals'}
                                    onClick={() => setView('approvals')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Image size={20} />}
                                    label="Social Kit"
                                    isActive={currentView === 'socialkit'}
                                    onClick={() => setView('socialkit')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<Megaphone size={20} />}
                                    label="Ads Control Center"
                                    isActive={currentView === 'meta_ads'}
                                    onClick={() => setView('meta_ads')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                                <NavItem
                                    icon={<BarChart3 size={20} />}
                                    label="Analytics"
                                    isActive={currentView === 'analytics'}
                                    onClick={() => setView('analytics')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                            </div>

                            <div className="pt-4 mt-4 border-t" style={{ borderColor: `${textPrimary}10` }}>
                                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider mb-2 opacity-50">Output</h3>
                                <NavItem
                                    icon={< BookOpen size={20} />}
                                    label="Brand Book"
                                    isActive={currentView === 'brandbook'}
                                    onClick={() => setView('brandbook')}
                                    accentColor={accentBg}
                                    textColor={textPrimary}
                                />
                            </div>
                        </>
                    ) : currentUser?.role === 'Designer' ? null : (
                        <>
                            <NavItem
                                icon={<Hotel size={20} />}
                                label="Reservations & PMS"
                                isActive={currentView === 'hospitality_pms'}
                                onClick={() => setView('hospitality_pms')}
                                accentColor={accentBg}
                                textColor={textPrimary}
                            />
                            <NavItem
                                icon={<ShoppingBag size={20} />}
                                label="Marketplace"
                                isActive={currentView === 'hospitality_marketplace'}
                                onClick={() => setView('hospitality_marketplace')}
                                accentColor={accentBg}
                                textColor={textPrimary}
                            />
                            <NavItem
                                icon={<PieChart size={20} />}
                                label="Finance Suite"
                                isActive={currentView === 'hospitality_finance'}
                                onClick={() => setView('hospitality_finance')}
                                accentColor={accentBg}
                                textColor={textPrimary}
                            />
                            <NavItem
                                icon={<Utensils size={20} />}
                                label="Guest Experience"
                                isActive={currentView === 'hospitality_guest'}
                                onClick={() => setView('hospitality_guest')}
                                accentColor={accentBg}
                                textColor={textPrimary}
                            />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t" style={{ borderColor: `${textPrimary}10` }}>
                    <button
                        onClick={() => setView('theme_settings')}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 transition-colors text-sm font-medium opacity-80 hover:opacity-100"
                    >
                        <Settings size={18} />
                        <span>Theme Settings</span>
                    </button>
                    <div className="flex items-center gap-3 mt-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border border-white/50 overflow-hidden">
                            {currentUser?.avatar_url && <img src={currentUser.avatar_url} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium opacity-90">{currentUser?.name}</span>
                            <select
                                value={currentUser?.role}
                                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                style={{ color: textPrimary }}
                                className="text-[10px] bg-transparent border-none p-0 focus:ring-0 cursor-pointer opacity-50 font-bold uppercase tracking-wider"
                            >
                                <option value="Admin">Admin Workspace</option>
                                <option value="Designer">Design Team</option>
                            </select>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};
