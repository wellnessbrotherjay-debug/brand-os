
import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Printer, ArrowLeft, Image as ImageIcon, Upload, X, Grid, Heart, MessageCircle, Send, Bookmark, Edit2, Save } from 'lucide-react';
import { BrandAsset, ContentMixItem } from '../types';

const PageContainer = ({ children, className = "", style = {} }: { children?: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
    <div className={`bg-white text-black aspect-[1/1.414] shadow-2xl mx-auto mb-12 p-16 relative overflow-hidden print:shadow-none print:mb-0 print:h-screen print:w-screen page-break ${className}`} style={{ maxWidth: '1000px', ...style }}>
        {children}
    </div>
);

export const BrandBook: React.FC = () => {
  const { activeBrandId, brands, identities, strategySections, assets, addAsset, updateIdentity } = useAppStore();
  const activeBrand = brands.find(b => b.id === activeBrandId);
  const identity = identities.find(i => i.brand_id === activeBrandId);
  
  // Asset Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<string | null>(null); // e.g., 'cover', 'about', 'moodboard_0'
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing Mix State
  const [isEditingMix, setIsEditingMix] = useState(false);
  const [localMix, setLocalMix] = useState<ContentMixItem[]>([]);

  if (!activeBrand || !identity) return <div>Loading Brand Book...</div>;

  const getStrategy = (type: string) => strategySections.find(s => s.brand_id === activeBrandId && s.section_type === type)?.content || "Not defined.";

  // --- IMAGE HANDLING LOGIC ---

  const handleImageClick = (target: string) => {
      setPickingTarget(target);
      setIsPickerOpen(true);
  };

  const handleAssetSelect = (assetUrl: string) => {
      if (!pickingTarget) return;
      
      const newConfig = { ...identity.brand_book_config };
      
      if (pickingTarget.startsWith('moodboard_')) {
          const index = parseInt(pickingTarget.split('_')[1]);
          const images = [...(newConfig.moodboard_images || [])];
          // Ensure array is large enough
          while(images.length <= index) images.push('');
          images[index] = assetUrl;
          newConfig.moodboard_images = images;
      } else {
          (newConfig as any)[pickingTarget + '_image_url'] = assetUrl;
      }

      updateIdentity({
          ...identity,
          brand_book_config: newConfig
      });
      setIsPickerOpen(false);
      setPickingTarget(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const url = reader.result as string;
              // Add to library
               addAsset({
                 id: crypto.randomUUID(),
                 brand_id: activeBrand.id,
                 asset_type: 'image',
                 title: file.name,
                 description: 'Brand Book Asset',
                 file_url: url,
                 tags: ['brandbook']
             });
             // Select immediately
             handleAssetSelect(url);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- MIX HANDLING ---
  const toggleMixEdit = () => {
      if (isEditingMix) {
          // Save
          updateIdentity({ ...identity, content_mix: localMix });
          setIsEditingMix(false);
      } else {
          // Open
          setLocalMix(identity.content_mix || [
              { label: 'Editorial', percentage: 33, color_hex: '#000000' },
              { label: 'Lifestyle', percentage: 33, color_hex: '#9ca3af' },
              { label: 'Education', percentage: 34, color_hex: '#e5e7eb' }
          ]);
          setIsEditingMix(true);
      }
  };

  const updateMixItem = (index: number, field: keyof ContentMixItem, value: any) => {
      const newMix = [...localMix];
      newMix[index] = { ...newMix[index], [field]: value };
      setLocalMix(newMix);
  };

  // --- SUBCOMPONENTS ---
  
  const ImageSlot = ({ target, className = "", placeholderText = "Click to Add Image" }: { target: string, className?: string, placeholderText?: string }) => {
      let currentUrl = "";
      if (target.startsWith('moodboard_')) {
          const idx = parseInt(target.split('_')[1]);
          currentUrl = identity.brand_book_config?.moodboard_images?.[idx] || "";
      } else {
          currentUrl = (identity.brand_book_config as any)?.[target + '_image_url'] || "";
      }

      return (
          <div 
            onClick={() => handleImageClick(target)}
            className={`bg-black/5 cursor-pointer hover:bg-black/10 transition-colors flex flex-col items-center justify-center relative overflow-hidden group ${className}`}
          >
              {currentUrl ? (
                  <img src={currentUrl} className="w-full h-full object-cover" alt="Brand Asset" />
              ) : (
                  <div className="text-center opacity-40 group-hover:opacity-70 transition-opacity p-4">
                      <ImageIcon className="mx-auto mb-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">{placeholderText}</span>
                  </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">Change Image</span>
              </div>
          </div>
      );
  }

  const handlePrint = () => {
      window.print();
  };

  // Determine dark text color for contrast if background is light
  const textColor = '#000000'; 
  const accentColor = identity.color_accent_hex;
  const currentMix = isEditingMix ? localMix : (identity.content_mix || [
        { label: 'Editorial', percentage: 33, color_hex: '#000000' },
        { label: 'Lifestyle', percentage: 33, color_hex: '#9ca3af' },
        { label: 'Education', percentage: 34, color_hex: '#e5e7eb' }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-100 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold font-serif-brand">Brand Book Publisher</h1>
        <button 
            onClick={handlePrint}
            className="bg-black text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-medium hover:opacity-80 transition-all"
        >
            <Printer size={18} /> Print / Save as PDF
        </button>
      </div>

      {/* PAGE 1: COVER */}
      <PageContainer className="flex flex-col justify-between" style={{ backgroundColor: identity.color_primary_hex }}>
          <div className="flex justify-between items-start z-10 relative">
             {identity.logo_primary_url && (
                 <img src={identity.logo_primary_url} className="h-32 w-auto object-contain" alt="Logo" />
             )}
             <div className="text-right">
                 <p className="text-sm font-bold tracking-widest uppercase opacity-40">Brand Guidelines</p>
                 <p className="text-sm font-medium opacity-60">Vol. 1.0</p>
             </div>
          </div>
          
          {/* Cover Image Background (Optional) */}
          <div className="absolute inset-0 top-0 bottom-0 left-0 right-0 z-0 opacity-10 pointer-events-none mix-blend-multiply">
               <ImageSlot target="cover" className="w-full h-full" placeholderText="Add Cover Texture" />
          </div>
          
          <div className="flex-1 flex items-center justify-center z-10 relative">
             <div className="text-center">
                 <h1 className="text-[8rem] leading-none font-serif-brand tracking-tighter mb-6 opacity-90">{activeBrand.name.split(' ')[0]}</h1>
                 {activeBrand.name.split(' ')[1] && (
                    <h1 className="text-[8rem] leading-none font-serif-brand tracking-tighter opacity-90 italic">{activeBrand.name.split(' ')[1]}</h1>
                 )}
             </div>
          </div>

          <div className="flex justify-between items-end border-t border-black/10 pt-8 z-10 relative">
              <div className="max-w-md">
                  <p className="font-serif-brand text-3xl italic leading-tight mb-4">{activeBrand.tagline}</p>
                  <p className="text-sm opacity-60 uppercase tracking-widest font-medium">{activeBrand.niche}</p>
              </div>
              <div className="text-right">
                  <p className="text-sm opacity-50">Prepared For</p>
                  <p className="font-bold text-lg">{activeBrand.name}</p>
              </div>
          </div>
      </PageContainer>

      {/* PAGE 2: ABOUT (SPLIT LAYOUT) */}
      <PageContainer>
          <div className="grid grid-cols-12 gap-0 h-full absolute inset-0">
              {/* Left Image Side */}
              <div className="col-span-5 h-full relative">
                 <ImageSlot target="about" className="w-full h-full" placeholderText="Add Brand Visual" />
              </div>
              
              {/* Right Content Side */}
              <div className="col-span-7 flex flex-col justify-center p-16 bg-white">
                   {/* Logo Header */}
                   <div className="absolute top-12 right-12">
                       {identity.logo_primary_url && <img src={identity.logo_primary_url} className="h-8 opacity-80" alt="Logo" />}
                   </div>

                  <h2 className="text-6xl font-serif-brand mb-8">The Essence</h2>
                  <div className="space-y-6 text-lg leading-relaxed opacity-80">
                      <p>{getStrategy('Purpose')}</p>
                      <p className="font-serif-brand text-3xl italic py-4 border-l-4 border-black pl-6">{getStrategy('Brand Promise')}</p>
                      <p>{getStrategy('Brand Story')}</p>
                  </div>
                  
                  <div className="mt-12 grid grid-cols-2 gap-8">
                      <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-40">Mission</h3>
                          <p className="text-sm opacity-80 leading-relaxed">{getStrategy('Mission')}</p>
                      </div>
                      <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-40">Vision</h3>
                          <p className="text-sm opacity-80 leading-relaxed">{getStrategy('Vision')}</p>
                      </div>
                  </div>
              </div>
          </div>
      </PageContainer>

      {/* PAGE 3: LOGO GUIDELINES (ENHANCED) */}
      <PageContainer className="bg-[#F9F9F9]">
           <div className="flex items-center justify-between mb-16">
               <h2 className="text-5xl font-serif-brand">Logo Guidelines</h2>
               <span className="text-9xl font-serif-brand opacity-5">03</span>
           </div>

            <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="col-span-1 bg-white p-8 shadow-sm flex flex-col justify-between">
                     <h3 className="text-sm font-bold uppercase tracking-wide mb-4 opacity-50">Main Logo</h3>
                     <div className="flex-1 flex items-center justify-center">
                         {identity.logo_primary_url && <img src={identity.logo_primary_url} className="w-full object-contain" />}
                     </div>
                     <p className="text-xs opacity-60 mt-4">Use for all primary brand applications.</p>
                </div>
                 <div className="col-span-2 bg-black text-white p-8 shadow-sm flex flex-col justify-between">
                     <h3 className="text-sm font-bold uppercase tracking-wide mb-4 opacity-50">Monochrome</h3>
                     <div className="flex-1 flex items-center justify-center">
                         {identity.logo_primary_url && <img src={identity.logo_primary_url} className="h-32 object-contain brightness-0 invert" />}
                     </div>
                     <p className="text-xs opacity-60 mt-4">Black or white versions for minimal layouts, print, and high-contrast backgrounds.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
               <div>
                   <h3 className="text-lg font-bold mb-2">Clear Space</h3>
                   <p className="opacity-60 leading-relaxed text-sm mb-6">
                       {identity.logo_rules || "Leave a minimum clear space equal to the height of the 'G' around all sides of the logo."}
                   </p>
                   <div className="border border-dashed border-black/30 p-8 relative inline-block">
                        {identity.logo_primary_url ? <img src={identity.logo_primary_url} className="h-16" /> : "Logo"}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-black"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-black"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-black"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-black"></div>
                   </div>
               </div>
               <div>
                   <h3 className="text-lg font-bold mb-2">Minimum Size</h3>
                    <div className="flex gap-12 items-end mt-8">
                       <div>
                           <div className="w-24 h-8 border border-black/10 bg-white mb-2 flex items-center justify-center text-[10px]">Logo</div>
                           <span className="text-xs opacity-40">Digital: 80px</span>
                       </div>
                       <div>
                           <div className="w-12 h-4 border border-black/10 bg-white mb-2 flex items-center justify-center text-[6px]">Logo</div>
                           <span className="text-xs opacity-40">Print: 25mm</span>
                       </div>
                   </div>
               </div>
            </div>
      </PageContainer>

      {/* PAGE 4: CREATIVE DIRECTION (NEW) */}
      <PageContainer>
          <div className="absolute inset-0 z-0">
               <ImageSlot target="moodboard_0" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between text-white p-8">
              <div className="flex justify-between items-start">
                   <h2 className="text-7xl font-serif-brand text-white drop-shadow-lg">Creative<br/>Direction</h2>
                   <span className="text-9xl font-serif-brand opacity-30 text-white">04</span>
              </div>
              
              <div className="max-w-md ml-auto text-right">
                   <p className="text-2xl font-serif-brand italic mb-4 drop-shadow-md">"{getStrategy('Creative Direction')}"</p>
                   <div className="w-24 h-1 bg-white ml-auto mb-4"></div>
                   <p className="text-sm opacity-90 leading-relaxed drop-shadow-md">{identity.image_style}</p>
              </div>
          </div>
      </PageContainer>

      {/* PAGE 5: VISUAL UNIVERSE / MOODBOARD */}
      <PageContainer>
          <div className="flex items-center justify-between mb-8">
               <h2 className="text-5xl font-serif-brand">Visual Universe</h2>
               <span className="text-9xl font-serif-brand opacity-5">05</span>
           </div>

           <div className="grid grid-cols-3 grid-rows-3 gap-4 h-[650px]">
               <div className="col-span-1 row-span-2">
                    <ImageSlot target="moodboard_1" className="w-full h-full" />
               </div>
               <div className="col-span-1 row-span-1">
                    <ImageSlot target="moodboard_2" className="w-full h-full" />
               </div>
               <div className="col-span-1 row-span-2">
                   <ImageSlot target="moodboard_3" className="w-full h-full" />
               </div>
               <div className="col-span-1 row-span-1">
                   <ImageSlot target="moodboard_4" className="w-full h-full" />
               </div>
               <div className="col-span-2 row-span-1">
                   <ImageSlot target="moodboard_5" className="w-full h-full" />
               </div>
           </div>
           
           <div className="mt-8 flex justify-between text-xs opacity-50 uppercase tracking-widest">
               <span>Feminine Silhouettes</span>
               <span>Wellness Rituals</span>
               <span>Natural Textures</span>
               <span>Soft Lighting</span>
           </div>
      </PageContainer>

      {/* PAGE 6: COLOR PALETTE */}
      <PageContainer>
          <div className="flex items-center justify-between mb-20">
               <h2 className="text-5xl font-serif-brand">Color System</h2>
               <span className="text-9xl font-serif-brand opacity-5">06</span>
           </div>

           <div className="grid grid-cols-12 gap-0 h-96 mb-12 shadow-sm">
               <div className="col-span-6 h-full flex items-end p-8" style={{ backgroundColor: identity.color_primary_hex }}>
                   <div>
                       <p className="text-xs uppercase tracking-widest opacity-50 mb-1 mix-blend-difference text-white">Primary</p>
                       <p className="font-mono text-lg mix-blend-difference text-white">{identity.color_primary_hex}</p>
                   </div>
               </div>
               <div className="col-span-3 h-full flex items-end p-8" style={{ backgroundColor: identity.color_secondary_hex }}>
                   <div>
                       <p className="text-xs uppercase tracking-widest opacity-50 mb-1 mix-blend-difference text-white">Secondary</p>
                       <p className="font-mono text-lg mix-blend-difference text-white">{identity.color_secondary_hex}</p>
                   </div>
               </div>
               <div className="col-span-3 h-full flex items-end p-8" style={{ backgroundColor: identity.color_accent_hex }}>
                   <div>
                       <p className="text-xs uppercase tracking-widest opacity-50 mb-1 mix-blend-difference text-white">Accent</p>
                       <p className="font-mono text-lg mix-blend-difference text-white">{identity.color_accent_hex}</p>
                   </div>
               </div>
           </div>

           <div className="grid grid-cols-2 gap-12">
               <div>
                   <h3 className="font-bold mb-4">Palette Description</h3>
                   <p className="opacity-60 leading-relaxed">{identity.color_palette_description || "A carefully curated selection of tones."}</p>
               </div>
               <div>
                    <h3 className="font-bold mb-4">Usage Ratios</h3>
                    <div className="w-full h-4 flex rounded-full overflow-hidden">
                        <div className="h-full bg-black/80" style={{ width: '60%' }}></div>
                        <div className="h-full bg-black/40" style={{ width: '30%' }}></div>
                        <div className="h-full bg-black/10" style={{ width: '10%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-2 opacity-50">
                        <span>60% Primary</span>
                        <span>30% Secondary</span>
                        <span>10% Accent</span>
                    </div>
               </div>
           </div>
      </PageContainer>

      {/* PAGE 7: TYPOGRAPHY */}
      <PageContainer className="bg-[#F4EDE5]/30">
           <div className="flex items-center justify-between mb-20">
               <h2 className="text-5xl font-serif-brand">Typography</h2>
               <span className="text-9xl font-serif-brand opacity-5">07</span>
           </div>

           <div className="grid grid-cols-2 gap-20">
               <div>
                   <p className="text-xs font-bold uppercase tracking-widest mb-4 opacity-40">Display / Headings</p>
                   <h3 className="text-6xl mb-4 font-serif-brand">{identity.font_heading}</h3>
                   <p className="text-8xl opacity-10 mb-8 leading-none overflow-hidden h-24 font-serif-brand">Aa Bb Cc</p>
                   <p className="text-sm opacity-60 leading-relaxed">
                       Use for main titles, brand statements, and luxury moments. 
                       Keep letter-spacing tight for headlines, loose for captions.
                   </p>
               </div>

               <div>
                   <p className="text-xs font-bold uppercase tracking-widest mb-4 opacity-40">Body Copy</p>
                   <h3 className="text-4xl mb-4 font-sans">{identity.font_body}</h3>
                    <div className="space-y-2 opacity-60 text-sm font-sans mb-8">
                        <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                        <p>abcdefghijklmnopqrstuvwxyz</p>
                        <p>1234567890 !@#$%^&*()</p>
                    </div>
                   <p className="text-sm opacity-60 leading-relaxed font-sans">
                       Use for all paragraphs, UI elements, and long-form reading. 
                       Ensures legibility and modern clarity against the soft organic display font.
                   </p>
               </div>
           </div>
      </PageContainer>

      {/* PAGE 8: SOCIAL MEDIA (NEW) */}
      <PageContainer>
           <div className="flex items-center justify-between mb-12">
               <h2 className="text-5xl font-serif-brand">Social Theme</h2>
               <span className="text-9xl font-serif-brand opacity-5">08</span>
           </div>
           
           <div className="flex gap-12">
               {/* Phone Mockup */}
               <div className="w-[300px] border-8 border-gray-100 rounded-[2rem] p-4 bg-white shadow-xl">
                   <div className="flex items-center justify-between mb-4">
                       <span className="font-bold text-xs">{activeBrand.id}</span>
                       <Grid size={16} />
                   </div>
                   
                   <div className="flex gap-4 mb-6">
                       <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                           {identity.logo_primary_url && <img src={identity.logo_primary_url} className="w-full h-full object-cover" />}
                       </div>
                       <div className="flex-1 text-[10px] space-y-1">
                           <div className="flex justify-between font-bold text-xs">
                               <span>120 Posts</span>
                               <span>5.2k</span>
                               <span>200</span>
                           </div>
                           <p className="opacity-60">{activeBrand.tagline}</p>
                       </div>
                   </div>
                   
                   {/* Grid */}
                   <div className="grid grid-cols-3 gap-1">
                       {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                           <div key={i} className="aspect-square bg-gray-100 relative overflow-hidden">
                               <ImageSlot target={`moodboard_${i % 4}`} className="w-full h-full" placeholderText="" />
                           </div>
                       ))}
                   </div>
                   
                   <div className="flex justify-around mt-4 opacity-40">
                       <Grid size={20} />
                       <Heart size={20} />
                   </div>
               </div>
               
               {/* Guidelines */}
               <div className="flex-1 py-8">
                   <h3 className="text-2xl font-serif-brand mb-6">Feed Aesthetics</h3>
                   <div className="space-y-8">
                       <div>
                           <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-sm">Content Mix</h4>
                                <button onClick={toggleMixEdit} className="text-xs flex items-center gap-1 opacity-50 hover:opacity-100">
                                    {isEditingMix ? <Save size={12}/> : <Edit2 size={12} />}
                                    {isEditingMix ? 'Save Changes' : 'Edit Mix'}
                                </button>
                           </div>
                           
                           {/* Content Mix Bar */}
                           <div className="w-full bg-gray-100 h-2 rounded-full mb-2 flex overflow-hidden">
                               {currentMix.map((item, idx) => (
                                   <div 
                                    key={idx} 
                                    className="h-full transition-all duration-300" 
                                    style={{ width: `${item.percentage}%`, backgroundColor: item.color_hex || '#000' }}
                                   ></div>
                               ))}
                           </div>
                           
                           {/* Legend / Inputs */}
                           <div className="flex justify-between text-xs opacity-60 flex-wrap gap-2">
                               {currentMix.map((item, idx) => (
                                   <div key={idx} className="flex items-center gap-2">
                                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color_hex }}></div>
                                       {isEditingMix ? (
                                           <div className="flex gap-1 items-center">
                                               <input 
                                                className="border rounded px-1 w-20 text-xs" 
                                                value={item.label}
                                                onChange={(e) => updateMixItem(idx, 'label', e.target.value)}
                                               />
                                               <input 
                                                className="border rounded px-1 w-10 text-xs" 
                                                type="number"
                                                value={item.percentage}
                                                onChange={(e) => updateMixItem(idx, 'percentage', parseInt(e.target.value))}
                                               />
                                               <span>%</span>
                                           </div>
                                       ) : (
                                           <span>{item.label} ({item.percentage}%)</span>
                                       )}
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       <div>
                           <h4 className="font-bold text-sm mb-2">Caption Style</h4>
                           <p className="text-sm opacity-60 leading-relaxed italic">
                               "{getStrategy('Tone of Voice')}"
                           </p>
                       </div>
                       
                       <div>
                           <h4 className="font-bold text-sm mb-2">Key Themes</h4>
                           <div className="flex flex-wrap gap-2">
                               {getStrategy('ContentPillars').split('•').slice(0,5).map(tag => (
                                   <span key={tag} className="border border-black/10 px-3 py-1 rounded-full text-xs">{tag}</span>
                               ))}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
      </PageContainer>


      {/* ASSET PICKER MODAL */}
      {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
              <div className="bg-white w-[600px] max-h-[80vh] rounded-xl shadow-2xl flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold">Select an Asset</h3>
                      <button onClick={() => setIsPickerOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto">
                      {/* Upload New */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-black/10 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-black/30 hover:bg-black/5 transition-colors mb-6"
                      >
                          <Upload className="mb-2 opacity-40" />
                          <span className="text-sm font-medium opacity-60">Upload New Image</span>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </div>

                      {/* Library */}
                      <h4 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3">From Library</h4>
                      <div className="grid grid-cols-3 gap-3">
                          {assets.filter(a => a.asset_type === 'image').map(asset => (
                              <div 
                                key={asset.id} 
                                onClick={() => handleAssetSelect(asset.file_url)}
                                className="aspect-square bg-black/5 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-black transition-all"
                              >
                                  <img src={asset.file_url} className="w-full h-full object-cover" alt={asset.title} />
                              </div>
                          ))}
                          {assets.filter(a => a.asset_type === 'image').length === 0 && (
                              <div className="col-span-3 text-center py-8 opacity-40 text-sm">No images found in library.</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
