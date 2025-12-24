
import React from 'react';
import { useAppStore } from '../store';
import { Users, ShoppingBag, ExternalLink, Plus } from 'lucide-react';

export const HospitalityMarketplace: React.FC = () => {
  const { affiliates, services, activeBrandId, identities } = useAppStore();
  const activeAffiliates = affiliates.filter(a => a.brand_id === activeBrandId);
  const activeServices = services.filter(s => s.brand_id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
             <div>
                 <h1 className="text-3xl font-bold font-serif-brand">Marketplace</h1>
                 <p className="opacity-60">Manage Partners, Affiliates, and Add-on Services.</p>
             </div>
             {activeIdentity?.logo_primary_url && (
                <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
             )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Affiliate Management */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-black/5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="opacity-40" />
                        <h2 className="text-xl font-bold">Affiliate Partners</h2>
                    </div>
                    <button className="text-xs bg-black text-white px-3 py-1 rounded font-medium hover:opacity-80">
                        + Invite Partner
                    </button>
                </div>
                
                <div className="space-y-4">
                    {activeAffiliates.map(affiliate => (
                        <div key={affiliate.id} className="bg-white p-4 rounded-lg border border-black/5 flex justify-between items-center group hover:shadow-md transition-all">
                            <div>
                                <h3 className="font-bold">{affiliate.name}</h3>
                                <p className="text-xs opacity-50">{affiliate.email}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">
                                        CODE: {affiliate.code}
                                    </span>
                                    <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">
                                        {affiliate.commission_rate}% COMM
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-40 uppercase tracking-wide mb-1">Total Sales</p>
                                <p className="text-xl font-bold">${affiliate.total_sales}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* Service Add-ons */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-black/5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="opacity-40" />
                        <h2 className="text-xl font-bold">Services & Add-ons</h2>
                    </div>
                    <button className="text-xs bg-black text-white px-3 py-1 rounded font-medium hover:opacity-80">
                        + Add Service
                    </button>
                </div>
                
                <div className="space-y-4">
                    {activeServices.map(service => (
                        <div key={service.id} className="bg-white p-4 rounded-lg border border-black/5 flex justify-between items-center hover:bg-black/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center font-bold opacity-60">
                                    {service.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{service.name}</h3>
                                    <p className="text-xs opacity-50">Provider: {service.provider}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs uppercase bg-black/5 px-2 py-1 rounded opacity-60 font-medium">
                                    {service.type}
                                </span>
                                <span className="font-mono font-bold">${service.price}</span>
                            </div>
                        </div>
                    ))}
                    
                    <button className="w-full border-2 border-dashed border-black/10 rounded-lg p-3 text-sm font-medium opacity-40 hover:opacity-100 hover:border-black/30 transition-all flex items-center justify-center gap-2">
                        <Plus size={16} /> Create New Offer
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};
