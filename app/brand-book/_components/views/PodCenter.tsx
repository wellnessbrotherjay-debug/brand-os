import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Pod } from '../types';
import {
    Layout, Users, Plus, ArrowRight, Layers, Box, PenTool, BarChart3, Settings
} from 'lucide-react';
import { PodDashboard } from './PodDashboard';

// Mapping icons to pod types
const POD_ICONS: Record<string, React.ReactNode> = {
    'marketing': <Layers size={24} />,
    'creative': <PenTool size={24} />,
    'analytics': <BarChart3 size={24} />,
    'operations': <Settings size={24} />,
    'brand': <Box size={24} />,
    'default': <Layout size={24} />
};

export const PodCenter = () => {
    const { pods, teamMembers } = useAppStore();
    const [activePodId, setActivePodId] = useState<string | null>(null);

    const activePod = pods.find(p => p.id === activePodId);

    if (activePod) {
        return <PodDashboard pod={activePod} onBack={() => setActivePodId(null)} />;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Pod System</h1>
                    <p className="text-gray-500">Specialized workspaces for your functional teams.</p>
                </div>
                <button className="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl">
                    <Plus size={16} /> Create Pod
                </button>
            </div>

            {/* Pod Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pods.map(pod => {
                    const icon = POD_ICONS[pod.type] || POD_ICONS['default'];
                    const memberCount = pod.team_member_ids.length;

                    return (
                        <div
                            key={pod.id}
                            onClick={() => setActivePodId(pod.id)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-gray-50 rounded-xl text-black group-hover:bg-black group-hover:text-white transition-colors">
                                    {icon}
                                </div>
                                <span className="bg-gray-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {pod.type}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{pod.name}</h3>
                            <p className="text-gray-500 text-sm mb-6 h-10 line-clamp-2">{pod.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex -space-x-2">
                                    {pod.team_member_ids.slice(0, 3).map((mid, idx) => (
                                        <div key={idx} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                            {/* Attempt to find user avatar or initial */}
                                            {/* Simplified for demo: just a colored circle if no url */}
                                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                                        </div>
                                    ))}
                                    {memberCount > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            +{memberCount - 3}
                                        </div>
                                    )}
                                </div>

                                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm flex items-center gap-1">
                                    Open <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* New Pod Placeholder */}
                <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors group">
                    <div className="p-4 bg-gray-50 rounded-full mb-4 group-hover:bg-gray-100">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-sm">Add New Pod</span>
                </button>
            </div>
        </div>
    );
};
