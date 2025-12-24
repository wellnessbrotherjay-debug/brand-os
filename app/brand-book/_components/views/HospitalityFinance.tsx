
import React from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export const HospitalityFinance: React.FC = () => {
  const { finance, activeBrandId, identities } = useAppStore();
  const activeFinance = finance.filter(f => f.brand_id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);

  // Calcs
  const revenue = activeFinance.filter(f => f.category === 'Revenue').reduce((acc, curr) => acc + curr.amount, 0);
  const costs = activeFinance.filter(f => f.category !== 'Revenue').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const profit = revenue - costs;

  const chartData = [
      { name: 'Revenue', amount: revenue },
      { name: 'Costs', amount: costs },
      { name: 'Profit', amount: profit }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
             <div>
                 <h1 className="text-3xl font-bold font-serif-brand">Financial Suite</h1>
                 <p className="opacity-60">P&L, CAPEX, and Revenue Management.</p>
             </div>
             <div className="flex items-center gap-4">
                 {activeIdentity?.logo_primary_url && (
                    <img src={activeIdentity.logo_primary_url} alt="Logo" className="h-12 w-auto opacity-90 object-contain" />
                 )}
                 <button className="bg-black text-white px-4 py-2 rounded text-sm hover:opacity-90">
                     Export Report
                 </button>
             </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Total Revenue</p>
                <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp size={24} />
                    <span className="text-3xl font-bold">${revenue.toLocaleString()}</span>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Total Costs</p>
                <div className="flex items-center gap-2 text-red-500">
                    <TrendingDown size={24} />
                    <span className="text-3xl font-bold">${costs.toLocaleString()}</span>
                </div>
            </div>
             <div className="bg-black text-white p-6 rounded-xl border border-black/5 shadow-sm">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Net Profit</p>
                <div className="flex items-center gap-2">
                    <DollarSign size={24} />
                    <span className="text-3xl font-bold">${profit.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-black/5">
                <h2 className="font-bold mb-6">Financial Overview</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={chartData} layout="vertical">
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                             <Tooltip cursor={{fill: 'transparent'}} />
                             <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                 <Cell fill="#4ade80" />
                                 <Cell fill="#f87171" />
                                 <Cell fill="#000000" />
                             </Bar>
                         </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-black/5">
                <h2 className="font-bold mb-6">Recent Transactions</h2>
                <div className="space-y-3">
                    {activeFinance.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
                            <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-xs opacity-50">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-mono font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
