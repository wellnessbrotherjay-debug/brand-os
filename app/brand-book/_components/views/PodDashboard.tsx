import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Pod, Project } from '../types';
import {
    Layout, Users, FolderOpen, MessageSquare, Plus, ArrowRight, Settings, FileText
} from 'lucide-react';
import { PodFilesView } from './PodFilesView';

interface PodDashboardProps {
    pod: Pod;
    onBack: () => void;
}

export const PodDashboard: React.FC<PodDashboardProps> = ({ pod, onBack }) => {
    const { projects, teamMembers } = useAppStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'team'>('overview');

    // Derived Data
    // Filter projects belonging to this pod.
    // Note: Since we just added pod_id, existing projects might not have it.
    // We can also show projects where the pod owner is a member as a fallback/heuristic for the demo?
    // Or just rely on strict pod_id.
    const podProjects = projects.filter(p => p.pod_id === pod.id);

    const members = teamMembers.filter(m => pod.team_member_ids.includes(m.id));

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Hero Header */}
            <div className="bg-white border-b border-gray-200 p-8 shadow-sm">
                <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-black mb-4 flex items-center gap-1">
                    ← Back to Pods
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-black text-white rounded-lg">
                                <Layout size={24} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{pod.name}</h1>
                        </div>
                        <p className="text-gray-500 max-w-2xl">{pod.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-4">
                            {members.map(m => (
                                <img key={m.id} src={m.avatar_url || ''} title={m.name} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                +{members.length}
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
                            <Settings size={16} /> Settings
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 px-8 mt-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'files' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Files & Assets
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'team' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Team
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8 max-w-7xl flex-1 overflow-y-auto">

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left Column: Projects & Work */}
                        <div className="col-span-2 space-y-8">

                            {/* Active Projects */}
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <FolderOpen size={20} className="text-gray-400" />
                                        Active Projects
                                    </h2>
                                    <button className="text-xs font-bold text-blue-600 hover:underline">+ New Project</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {podProjects.length > 0 ? podProjects.map(project => (
                                        <div key={project.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-2xl">{project.icon}</span>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === 'Live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>

                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                                <span>Due {new Date(project.deadline || '').toLocaleDateString()}</span>
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                            <FolderOpen size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm font-medium">No projects linked to this pod yet.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Recent Files (Stub) */}
                            <section>
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <Layout size={20} className="text-gray-400" />
                                    Recent Files
                                </h2>
                                <div className="bg-white rounded-xl border border-gray-200 p-1">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">File Name</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3 rounded-tr-lg text-right">Size</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-4 py-3 text-gray-900 font-medium">Q3_Campaign_Brief.pdf</td>
                                                <td className="px-4 py-3 text-gray-500">Document</td>
                                                <td className="px-4 py-3 text-gray-400 text-right">2.4 MB</td>
                                            </tr>
                                            <tr className="border-t border-gray-50">
                                                <td className="px-4 py-3 text-gray-900 font-medium">Logo_Pack_Final.zip</td>
                                                <td className="px-4 py-3 text-gray-500">Archive</td>
                                                <td className="px-4 py-3 text-gray-400 text-right">145 MB</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                        </div>

                        {/* Right Column: Activity & Team */}
                        <div className="space-y-8">
                            {/* Team Widget */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center justify-between">
                                    Team Members
                                    <button className="p-1 hover:bg-gray-100 rounded"><Plus size={14} /></button>
                                </h3>
                                <div className="space-y-3">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center gap-3">
                                            <img src={m.avatar_url} className="w-8 h-8 rounded-full bg-gray-100" />
                                            <div>
                                                <div className="text-sm font-bold">{m.name}</div>
                                                <div className="text-[10px] text-gray-400">{m.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Chat Widget */}
                            <div className="bg-black text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><MessageSquare size={14} /> Pod Chat</h3>
                                    <p className="text-xs text-gray-400 mb-4">Post updates for the whole team.</p>

                                    <div className="bg-white/10 rounded-lg p-3 mb-3 text-xs">
                                        <span className="font-bold text-gray-300">Sarah:</span> Has anyone seen the latest approved copy?
                                    </div>

                                    <button className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                                        Open Chat
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && <PodFilesView pod={pod} />}

                {activeTab === 'team' && (
                    <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">Team Management</h3>
                        <p>Detailed team permissions coming soon.</p>
                    </div>
                )}

            </div>
        </div>
    );
};
