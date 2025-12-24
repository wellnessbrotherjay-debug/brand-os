
import React from 'react';
import { useAppStore } from '../store';
import { Utensils, Dumbbell, Clock } from 'lucide-react';

export const HospitalityGuest: React.FC = () => {
  const { menu, activeBrandId, identities } = useAppStore();
  const activeMenu = menu.filter(m => m.brand_id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
             <div>
                 <h1 className="text-3xl font-bold font-serif-brand">Guest Experience</h1>
                 <p className="opacity-60">Manage Menus, Wellness Programs, and App Content.</p>
             </div>
             {activeIdentity?.logo_primary_url && (
                <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
             )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Menu Management */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-xl border border-black/5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-serif-brand flex items-center gap-2">
                        <Utensils className="opacity-40" /> Wellness Menu
                    </h2>
                    <button className="text-xs font-bold underline">Edit Menu</button>
                </div>
                
                <div className="space-y-6">
                    {['Elixir', 'Breakfast', 'Lunch'].map(category => (
                        <div key={category}>
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3 border-b border-black/5 pb-1">{category}</h3>
                            <div className="space-y-3">
                                {activeMenu.filter(m => m.category === category).map(item => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm">{item.name}</p>
                                            <p className="text-xs opacity-50 italic">{item.macros}</p>
                                        </div>
                                        <span className="font-mono text-sm opacity-80">${item.price}</span>
                                    </div>
                                ))}
                                {activeMenu.filter(m => m.category === category).length === 0 && (
                                    <p className="text-xs opacity-30 italic">No items available.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Workout Builder (Mock) */}
            <div className="bg-black text-white p-8 rounded-xl border border-black/5 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold font-serif-brand flex items-center gap-2">
                            <Dumbbell className="opacity-70" /> HotelFit
                        </h2>
                        <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Live Beta</span>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold">Morning Flow</h3>
                                <div className="flex items-center gap-1 text-xs opacity-70">
                                    <Clock size={12} /> 20 min
                                </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                                <span className="h-1 w-full bg-green-400 rounded-full"></span>
                                <span className="h-1 w-full bg-green-400 rounded-full"></span>
                                <span className="h-1 w-full bg-white/20 rounded-full"></span>
                            </div>
                            <p className="text-xs opacity-60">Beginner • Mobility • Grounding</p>
                        </div>

                         <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold">HIIT Strength</h3>
                                <div className="flex items-center gap-1 text-xs opacity-70">
                                    <Clock size={12} /> 45 min
                                </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                                <span className="h-1 w-full bg-red-400 rounded-full"></span>
                                <span className="h-1 w-full bg-red-400 rounded-full"></span>
                                <span className="h-1 w-full bg-red-400 rounded-full"></span>
                            </div>
                            <p className="text-xs opacity-60">Advanced • Cardio • Power</p>
                        </div>
                    </div>

                    <button className="w-full bg-white text-black py-3 rounded-lg font-bold mt-8 hover:bg-gray-200 transition-colors">
                        Launch Workout Builder
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};
