
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Layout, Search, Plus, Filter, Image as ImageIcon, Video, FileText, Monitor, Smartphone, Printer, Mail, Layers, Instagram, Facebook, Youtube, Linkedin, Scaling } from 'lucide-react';

const mockTemplates = [
    // --- SOCIAL: Instagram ---
    { id: 'ig-1', name: "Quote Card Minimal", category: "Social", platform: "Instagram", type: "Post", width: 1080, height: 1080, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400", ratio: 'Square' },
    { id: 'ig-2', name: "New Arrival Spotlight", category: "Social", platform: "Instagram", type: "Post", width: 1080, height: 1080, image: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=400", ratio: 'Square' },
    { id: 'ig-7', name: "Event Announcement", category: "Social", platform: "Instagram", type: "Story", width: 1080, height: 1920, image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400", ratio: 'Portrait' },
    { id: 'ig-10', name: "Reel Cover - Aesthetic", category: "Social", platform: "Instagram", type: "Cover", width: 1080, height: 1920, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400", ratio: 'Portrait' },
    
    // --- SOCIAL: Facebook ---
    { id: 'fb-1', name: "Event Header", category: "Social", platform: "Facebook", type: "Banner", width: 820, height: 312, image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400", ratio: 'Landscape' },
    { id: 'fb-4', name: "Standard Link Post", category: "Social", platform: "Facebook", type: "Post", width: 1200, height: 630, image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400", ratio: 'Landscape' },

    // --- SOCIAL: YouTube ---
    { id: 'yt-1', name: "Vlog Thumbnail", category: "Social", platform: "YouTube", type: "Thumbnail", width: 1280, height: 720, image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400", ratio: 'Landscape' },
    { id: 'yt-4', name: "Channel Art - Modern", category: "Social", platform: "YouTube", type: "Banner", width: 2560, height: 1440, image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400", ratio: 'Landscape' },

    // --- SOCIAL: LinkedIn ---
    { id: 'li-1', name: "Corporate Header", category: "Social", platform: "LinkedIn", type: "Banner", width: 1584, height: 396, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400", ratio: 'Landscape' },
    { id: 'li-2', name: "Hiring Announcement", category: "Social", platform: "LinkedIn", type: "Post", width: 1200, height: 1200, image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400", ratio: 'Square' },

    // --- SOCIAL: TikTok ---
    { id: 'tt-1', name: "Green Screen Style", category: "Social", platform: "TikTok", type: "Background", width: 1080, height: 1920, image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400", ratio: 'Portrait' },

    // --- REDBOOK (MOCK) ---
    { id: 'rb-1', name: "Lifestyle Note Cover", category: "Social", platform: "Redbook", type: "Post", width: 1242, height: 1660, image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400", ratio: 'Portrait' },

    // --- PRINT ---
    { id: 'pr-1', name: "Event Flyer A4", category: "Print", platform: "Print", type: "Flyer", width: 2480, height: 3508, image: "https://images.unsplash.com/photo-1626785774573-4b7993143a23?w=400", ratio: 'Portrait' },
    { id: 'pr-2', name: "Business Card Front", category: "Print", platform: "Print", type: "Card", width: 1050, height: 600, image: "https://images.unsplash.com/photo-1593085512500-bfd11932f80c?w=400", ratio: 'Landscape' },

    // --- DIGITAL ---
    { id: 'dg-1', name: "Blog Header", category: "Digital", platform: "Web", type: "Banner", width: 1200, height: 600, image: "https://images.unsplash.com/photo-1499750310159-52f0f834631e?w=400", ratio: 'Landscape' },
    { id: 'dg-2', name: "Email Newsletter Header", category: "Digital", platform: "Email", type: "Banner", width: 600, height: 200, image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400", ratio: 'Landscape' },
];

export const TemplatesView: React.FC = () => {
  const [platformFilter, setPlatformFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [ratioFilter, setRatioFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const filteredTemplates = mockTemplates.filter(t => {
      const matchesPlatform = platformFilter === 'All' || t.platform === platformFilter;
      const matchesType = typeFilter === 'All' || t.type === typeFilter;
      const matchesRatio = ratioFilter === 'All' || t.ratio === ratioFilter;
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      return matchesPlatform && matchesType && matchesRatio && matchesSearch;
  });

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'Instagram': return <Instagram size={14} />;
          case 'Facebook': return <Facebook size={14} />;
          case 'YouTube': return <Youtube size={14} />;
          case 'LinkedIn': return <Linkedin size={14} />;
          default: return <Layout size={14} />;
      }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold font-serif-brand">Template Library</h1>
                <p className="opacity-60">Brand-approved layouts for social media, print, and digital.</p>
            </div>
            
            <div className="flex gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black" 
                        placeholder="Search templates..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-80">
                    <Plus size={16} /> New Template
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-black/5">
            {/* Row 1: Platform & Ratio */}
            <div className="flex gap-8">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase opacity-50 w-16">Platform</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['All', 'Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'TikTok', 'Redbook', 'Print', 'Web', 'Email'].map(p => (
                            <button 
                                key={p}
                                onClick={() => setPlatformFilter(p)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${platformFilter === p ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
                            >
                                {getPlatformIcon(p)} {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-px bg-gray-200 h-8 self-center"></div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase opacity-50">Dimensions</span>
                    <div className="flex gap-2">
                        {['All', 'Square', 'Portrait', 'Landscape'].map(r => (
                            <button 
                                key={r}
                                onClick={() => setRatioFilter(r)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${ratioFilter === r ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
                            >
                                {r === 'Square' && <div className="w-3 h-3 border border-current rounded-sm"></div>}
                                {r === 'Portrait' && <div className="w-2 h-3 border border-current rounded-sm"></div>}
                                {r === 'Landscape' && <div className="w-3 h-2 border border-current rounded-sm"></div>}
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Type/Format */}
            <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
                <span className="text-xs font-bold uppercase opacity-50 w-16">Format</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Post', 'Story', 'Banner', 'Cover', 'Thumbnail', 'Flyer', 'Card'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${typeFilter === t ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 flex-1 overflow-y-auto pb-20">
            {/* Create New Block */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-black/20 hover:text-black transition-colors cursor-pointer min-h-[300px]">
                <Layout size={48} className="mb-4 opacity-50" />
                <span className="font-bold text-sm">Start from Blank</span>
            </div>

            {filteredTemplates.map(t => (
                <div key={t.id} className="group relative bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col">
                    <div className={`relative overflow-hidden flex items-center justify-center bg-gray-50 border-b border-gray-100 ${t.ratio === 'Portrait' ? 'aspect-[9/16]' : t.ratio === 'Landscape' ? 'aspect-[16/9]' : 'aspect-square'}`}>
                        <img src={t.image} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <button className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                Edit Design
                            </button>
                        </div>
                        {/* Type Badge */}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
                            {t.type}
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-1 mb-1 opacity-50">
                                {getPlatformIcon(t.platform)}
                                <span className="text-[10px] font-bold uppercase">{t.platform}</span>
                            </div>
                            <h3 className="font-bold text-sm leading-tight line-clamp-2">{t.name}</h3>
                        </div>
                        <p className="text-[10px] opacity-40 mt-2 font-mono">{t.width} x {t.height}px</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
