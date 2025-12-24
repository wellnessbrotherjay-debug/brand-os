
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { BrandTemplate, DesignLayer } from '../types';
import { 
    Layout, Image as ImageIcon, Type, Square, Save, Download, 
    Palette, Layers, MoreHorizontal, MousePointer, 
    CheckCircle2, AlertCircle, Wand2, Upload, ChevronRight,
    Move, Lock, Trash2, ExternalLink
} from 'lucide-react';

export const TemplateStudio: React.FC = () => {
  const { activeBrandId, brands, identities, assets, brandTemplates, addBrandTemplate, updateBrandTemplate } = useAppStore();
  const [activeTemplate, setActiveTemplate] = useState<BrandTemplate | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5); // Canvas zoom
  
  const activeBrand = brands.find(b => b.id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);

  // --- BRAND GUARDRAILS ---
  const isColorOnBrand = (hex: string) => {
      if (!activeIdentity) return true;
      const palette = [
          activeIdentity.color_primary_hex,
          activeIdentity.color_secondary_hex,
          activeIdentity.color_accent_hex,
          '#000000', '#FFFFFF'
      ].map(c => c?.toLowerCase());
      return palette.includes(hex.toLowerCase());
  };

  const isFontOnBrand = (font: string) => {
      if (!activeIdentity) return true;
      const fonts = [activeIdentity.font_heading, activeIdentity.font_body];
      return fonts.some(f => f.includes(font) || font.includes(f));
  };

  // --- CANVAS HELPERS ---
  const handleLayerUpdate = (id: string, updates: Partial<DesignLayer>) => {
      if (!activeTemplate) return;
      const newLayers = activeTemplate.layers.map(l => l.id === id ? { ...l, ...updates } : l);
      updateBrandTemplate(activeTemplate.id, { layers: newLayers });
  };

  const addLayer = (type: DesignLayer['type']) => {
      if (!activeTemplate) return;
      const newLayer: DesignLayer = {
          id: crypto.randomUUID(),
          type,
          content: type === 'text' ? 'Double Click to Edit' : '',
          x: 10, y: 10,
          width: type === 'text' ? 50 : 30,
          height: type === 'text' ? 10 : 30,
          rotation: 0,
          style: {
              zIndex: activeTemplate.layers.length,
              color: '#000000',
              fontSize: 24,
              fontFamily: activeIdentity?.font_body || 'Inter',
              backgroundColor: type === 'shape' ? '#CCCCCC' : undefined
          }
      };
      updateBrandTemplate(activeTemplate.id, { layers: [...activeTemplate.layers, newLayer] });
      setSelectedLayerId(newLayer.id);
  };

  const removeLayer = (id: string) => {
      if (!activeTemplate) return;
      updateBrandTemplate(activeTemplate.id, { layers: activeTemplate.layers.filter(l => l.id !== id) });
      setSelectedLayerId(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const assetUrl = e.dataTransfer.getData('text/plain');
      if (assetUrl && activeTemplate) {
          const newLayer: DesignLayer = {
              id: crypto.randomUUID(),
              type: 'image',
              content: assetUrl,
              x: 25, y: 25, width: 50, height: 50, rotation: 0,
              style: { zIndex: activeTemplate.layers.length }
          };
          updateBrandTemplate(activeTemplate.id, { layers: [...activeTemplate.layers, newLayer] });
      }
  };

  // --- CANVA INTEGRATION STUB ---
  const handleEditInCanva = () => {
      alert("Opening Canva Connect API...\n(In production, this would open a deep link to Canva's editor with your brand assets pre-loaded.)");
  };

  if (!activeBrand) return <div className="p-10">Select a brand to start designing.</div>;

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white overflow-hidden">
        
        {/* LEFT SIDEBAR: ASSETS & TEMPLATES */}
        <div className="w-80 border-r border-white/10 flex flex-col bg-[#252525]">
            <div className="p-4 border-b border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Library</h2>
                <div className="flex gap-2">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded text-xs font-bold">Templates</button>
                    <button className="flex-1 bg-transparent hover:bg-white/5 py-2 rounded text-xs font-bold text-gray-400">Uploads</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Templates Grid */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase">Base Layouts</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {brandTemplates.filter(t => t.brand_id === activeBrandId).map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setActiveTemplate(t)}
                                className={`aspect-square bg-white/5 rounded-lg border-2 cursor-pointer hover:border-white/50 transition-colors relative group overflow-hidden ${activeTemplate?.id === t.id ? 'border-green-500' : 'border-transparent'}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-white">
                                    {t.name}
                                </div>
                            </div>
                        ))}
                        <div 
                            onClick={() => {
                                const newT: BrandTemplate = {
                                    id: crypto.randomUUID(),
                                    brand_id: activeBrandId,
                                    name: 'New Design',
                                    channel: 'Instagram',
                                    type: 'Post',
                                    dimensions: { width: 1080, height: 1080 },
                                    layers: [],
                                    tags: []
                                };
                                addBrandTemplate(newT);
                                setActiveTemplate(newT);
                            }}
                            className="aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/5"
                        >
                            <Layout size={24} className="opacity-50 mb-2"/>
                            <span className="text-[10px] opacity-50">New Blank</span>
                        </div>
                    </div>
                </div>

                {/* Draggable Assets */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase">Brand Assets</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {assets.filter(a => a.asset_type === 'image').map(asset => (
                            <div 
                                key={asset.id}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', asset.file_url)}
                                className="aspect-square bg-black rounded overflow-hidden cursor-move hover:ring-1 hover:ring-white"
                            >
                                <img src={asset.file_url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* CENTER: CANVAS */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#252525]">
                <div className="flex items-center gap-4">
                    <div className="flex bg-black/20 rounded p-1">
                        <button onClick={() => addLayer('text')} className="p-2 hover:bg-white/10 rounded" title="Add Text"><Type size={16} /></button>
                        <button onClick={() => addLayer('shape')} className="p-2 hover:bg-white/10 rounded" title="Add Shape"><Square size={16} /></button>
                        <button className="p-2 hover:bg-white/10 rounded" title="Upload"><Upload size={16} /></button>
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="text-xs opacity-50 font-mono">
                        {activeTemplate ? `${activeTemplate.dimensions.width} x ${activeTemplate.dimensions.height}px` : 'No Selection'}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleEditInCanva}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] rounded text-xs font-bold hover:opacity-90"
                    >
                        <ExternalLink size={14} /> Edit in Canva
                    </button>
                    <button className="px-4 py-2 bg-white text-black rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-2">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {activeTemplate ? (
                    <div 
                        className="bg-white shadow-2xl relative transition-all"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        style={{
                            width: activeTemplate.dimensions.width * scale,
                            height: activeTemplate.dimensions.height * scale,
                        }}
                    >
                        {/* Render Layers */}
                        {activeTemplate.layers.map(layer => (
                            <div
                                key={layer.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                className={`absolute cursor-move group ${selectedLayerId === layer.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'}`}
                                style={{
                                    left: `${layer.x}%`,
                                    top: `${layer.y}%`,
                                    width: `${layer.width}%`,
                                    height: layer.type === 'text' ? 'auto' : `${layer.height}%`,
                                    transform: `rotate(${layer.rotation}deg)`,
                                    zIndex: layer.style.zIndex
                                }}
                            >
                                {layer.type === 'image' && <img src={layer.content} className="w-full h-full object-cover pointer-events-none" />}
                                {layer.type === 'shape' && <div className="w-full h-full" style={{ backgroundColor: layer.style.backgroundColor }} />}
                                {layer.type === 'text' && (
                                    <div style={{
                                        fontSize: (layer.style.fontSize || 24) * scale,
                                        color: layer.style.color,
                                        fontFamily: layer.style.fontFamily,
                                        textAlign: layer.style.textAlign
                                    }}>
                                        {layer.content}
                                    </div>
                                )}
                                {layer.type === 'logo' && activeIdentity?.logo_primary_url && (
                                    <img src={activeIdentity.logo_primary_url} className="w-full h-full object-contain pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-white/20 flex flex-col items-center">
                        <MousePointer size={48} className="mb-4" />
                        <p>Select a template to edit</p>
                    </div>
                )}
            </div>
            
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur rounded-full px-4 py-2 flex gap-4 text-xs font-bold">
                <button onClick={() => setScale(Math.max(0.1, scale - 0.1))}>-</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(Math.min(2, scale + 0.1))}>+</button>
            </div>
        </div>

        {/* RIGHT SIDEBAR: PROPERTIES & GUARDRAILS */}
        <div className="w-72 border-l border-white/10 bg-[#252525] flex flex-col">
            {selectedLayerId && activeTemplate ? (
                <div className="p-4 space-y-6">
                    {(() => {
                        const layer = activeTemplate.layers.find(l => l.id === selectedLayerId);
                        if (!layer) return null;
                        
                        // Guardrail Checks
                        const colorOk = layer.style.color ? isColorOnBrand(layer.style.color) : true;
                        const bgOk = layer.style.backgroundColor ? isColorOnBrand(layer.style.backgroundColor) : true;
                        const fontOk = layer.style.fontFamily ? isFontOnBrand(layer.style.fontFamily) : true;

                        return (
                            <>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-sm uppercase">Properties</h3>
                                    <button onClick={() => removeLayer(layer.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                                </div>

                                {/* Brand Guardrails Status */}
                                <div className="bg-black/20 p-3 rounded text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-50">Color Match</span>
                                        {colorOk && bgOk ? <CheckCircle2 size={14} className="text-green-500"/> : <AlertCircle size={14} className="text-orange-500"/>}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-50">Typography</span>
                                        {fontOk ? <CheckCircle2 size={14} className="text-green-500"/> : <AlertCircle size={14} className="text-orange-500"/>}
                                    </div>
                                </div>

                                {/* Content Edit */}
                                {layer.type === 'text' && (
                                    <div>
                                        <label className="text-xs font-bold opacity-50 block mb-1">Content</label>
                                        <textarea 
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white"
                                            value={layer.content}
                                            onChange={(e) => handleLayerUpdate(layer.id, { content: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Style Controls */}
                                <div>
                                    <label className="text-xs font-bold opacity-50 block mb-1">Position</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={layer.x} onChange={(e) => handleLayerUpdate(layer.id, { x: parseInt(e.target.value) })} className="bg-black/20 border border-white/10 rounded p-1 text-xs"/>
                                        <input type="number" value={layer.y} onChange={(e) => handleLayerUpdate(layer.id, { y: parseInt(e.target.value) })} className="bg-black/20 border border-white/10 rounded p-1 text-xs"/>
                                    </div>
                                </div>

                                {/* Colors */}
                                {layer.style.color !== undefined && (
                                    <div>
                                        <label className="text-xs font-bold opacity-50 block mb-1">Text Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[activeIdentity?.color_primary_hex, activeIdentity?.color_secondary_hex, activeIdentity?.color_accent_hex, '#000000', '#FFFFFF'].filter(Boolean).map((c, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-6 h-6 rounded-full cursor-pointer border ${layer.style.color === c ? 'border-white' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => handleLayerUpdate(layer.id, { style: { ...layer.style, color: c } })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            ) : (
                <div className="p-8 text-center opacity-30 flex flex-col items-center">
                    <Layers size={32} className="mb-2"/>
                    <p className="text-xs">Select a layer to edit</p>
                </div>
            )}
        </div>
    </div>
  );
};
