
import React from 'react';
import { useAppStore } from '../store';
import { Palette, Monitor, RefreshCw, Check } from 'lucide-react';

export const ThemeSettings: React.FC = () => {
  const { activeBrandId, identities, updateIdentity } = useAppStore();
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);

  if (!activeIdentity) return <div>Loading...</div>;

  const uiConfig = activeIdentity.ui_config || { use_identity_theme: true };
  const customColors = uiConfig.custom_colors || {
      background: '#f8fafc',
      sidebar: '#ffffff',
      text_primary: '#000000',
      text_secondary: '#64748b',
      accent: '#4f46e5'
  };

  const handleToggle = (useIdentity: boolean) => {
      updateIdentity({
          ...activeIdentity,
          ui_config: {
              ...uiConfig,
              use_identity_theme: useIdentity
          }
      });
  };

  const handleColorChange = (key: keyof typeof customColors, value: string) => {
      updateIdentity({
          ...activeIdentity,
          ui_config: {
              ...uiConfig,
              use_identity_theme: false, // Auto-switch to custom if editing colors
              custom_colors: {
                  ...customColors,
                  [key]: value
              }
          }
      });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold font-serif-brand">Theme Studio</h1>
                <p className="opacity-60">Customize the look and feel of your workspace.</p>
            </div>
            {activeIdentity?.logo_primary_url && (
                <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
            )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Control Panel */}
            <div className="space-y-8">
                
                <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Monitor size={18} /> Display Mode
                    </h3>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button 
                            onClick={() => handleToggle(true)}
                            className={`flex-1 py-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${uiConfig.use_identity_theme ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            <RefreshCw size={14} /> Sync with Identity
                        </button>
                        <button 
                            onClick={() => handleToggle(false)}
                            className={`flex-1 py-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${!uiConfig.use_identity_theme ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            <Palette size={14} /> Custom Theme
                        </button>
                    </div>
                    <p className="text-xs opacity-60 mt-4 leading-relaxed">
                        <strong>Sync Mode:</strong> Automatically applies your Brand Identity colors (Primary, Secondary) to the dashboard.
                        <br/>
                        <strong>Custom Mode:</strong> Allows you to manually override specific UI elements for better visibility or contrast.
                    </p>
                </div>

                <div className={`transition-opacity duration-300 ${uiConfig.use_identity_theme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <h3 className="font-bold mb-6">Interface Colors</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">App Background</label>
                            <div className="flex gap-3">
                                <input type="color" value={customColors.background} onChange={(e) => handleColorChange('background', e.target.value)} className="h-10 w-20 rounded cursor-pointer border border-black/10" />
                                <input type="text" value={customColors.background} onChange={(e) => handleColorChange('background', e.target.value)} className="flex-1 border border-black/10 rounded px-3 font-mono text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Sidebar Background</label>
                            <div className="flex gap-3">
                                <input type="color" value={customColors.sidebar} onChange={(e) => handleColorChange('sidebar', e.target.value)} className="h-10 w-20 rounded cursor-pointer border border-black/10" />
                                <input type="text" value={customColors.sidebar} onChange={(e) => handleColorChange('sidebar', e.target.value)} className="flex-1 border border-black/10 rounded px-3 font-mono text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Primary Text</label>
                            <div className="flex gap-3">
                                <input type="color" value={customColors.text_primary} onChange={(e) => handleColorChange('text_primary', e.target.value)} className="h-10 w-20 rounded cursor-pointer border border-black/10" />
                                <input type="text" value={customColors.text_primary} onChange={(e) => handleColorChange('text_primary', e.target.value)} className="flex-1 border border-black/10 rounded px-3 font-mono text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Accent Color</label>
                            <div className="flex gap-3">
                                <input type="color" value={customColors.accent} onChange={(e) => handleColorChange('accent', e.target.value)} className="h-10 w-20 rounded cursor-pointer border border-black/10" />
                                <input type="text" value={customColors.accent} onChange={(e) => handleColorChange('accent', e.target.value)} className="flex-1 border border-black/10 rounded px-3 font-mono text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Live Preview (Mockup) */}
            <div className="bg-gray-100 p-8 rounded-xl flex items-center justify-center">
                <div 
                    className="w-[300px] h-[400px] shadow-2xl rounded-lg overflow-hidden flex flex-col transition-colors duration-300"
                    style={{ backgroundColor: uiConfig.use_identity_theme ? activeIdentity.color_primary_hex : customColors.background }}
                >
                    {/* Header */}
                    <div className="h-12 border-b flex items-center px-4" style={{ borderColor: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex + '20' : customColors.text_primary + '20' }}>
                        <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    
                    <div className="flex flex-1">
                        {/* Sidebar Mock */}
                        <div className="w-16 border-r flex flex-col items-center py-4 gap-4" style={{ 
                            backgroundColor: uiConfig.use_identity_theme ? activeIdentity.color_primary_hex : customColors.sidebar,
                            borderColor: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex + '20' : customColors.text_primary + '20'
                        }}>
                            <div className="w-8 h-8 rounded bg-current opacity-20" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.accent }}></div>
                            <div className="w-8 h-8 rounded bg-current opacity-10" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_primary }}></div>
                            <div className="w-8 h-8 rounded bg-current opacity-10" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_primary }}></div>
                        </div>
                        
                        {/* Content Mock */}
                        <div className="flex-1 p-4">
                            <div className="w-3/4 h-6 rounded mb-4 bg-current opacity-80" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_primary }}></div>
                            <div className="w-full h-2 rounded mb-2 bg-current opacity-20" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_secondary }}></div>
                            <div className="w-5/6 h-2 rounded mb-2 bg-current opacity-20" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_secondary }}></div>
                            
                            <div className="mt-8 p-4 rounded border" style={{ borderColor: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex + '20' : customColors.text_primary + '10' }}>
                                <div className="w-8 h-8 rounded mb-2 bg-current opacity-20" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.accent }}></div>
                                <div className="w-1/2 h-3 rounded bg-current opacity-40" style={{ color: uiConfig.use_identity_theme ? activeIdentity.color_accent_hex : customColors.text_primary }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};
