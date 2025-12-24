
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { TeamMember, TeamRole } from '../types';
import { Users, Shield, Plus, MoreHorizontal, Check, X, Search, Mail, Trash2, Edit2, Layout, Database, Camera, Image as ImageIcon } from 'lucide-react';

export const TeamManagement: React.FC = () => {
    const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, projects, updateProject, currentUser } = useAppStore();
    const [activeTab, setActiveTab] = useState<'members' | 'access'>('members');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    // Form State
    const [newMember, setNewMember] = useState<Partial<TeamMember>>({
        name: '',
        email: '',
        role: 'Marketing',
        status: 'active',
        bio: '',
        country_flag: '🇺🇸',
        achievements: [],
        gallery_images: []
    });

    const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
    const galleryFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setNewMember(prev => ({ ...prev, avatar_url: ev.target!.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setNewMember(prev => ({
                        ...prev,
                        gallery_images: [...(prev.gallery_images || []), ev.target!.result as string]
                    }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setNewMember(prev => ({
            ...prev,
            gallery_images: (prev.gallery_images || []).filter((_, i) => i !== index)
        }));
    };

    const handleSaveMember = () => {
        if (!newMember.name || !newMember.email) return alert("Name and Email required");

        const memberData = {
            ...newMember,
            avatar_url: newMember.avatar_url || `https://ui-avatars.com/api/?name=${newMember.name}&background=random`
        } as TeamMember;

        if (editingMember) {
            updateTeamMember(editingMember.id, memberData);
            setEditingMember(null);
        } else {
            addTeamMember({
                ...memberData,
                id: crypto.randomUUID()
            });
        }
        setIsAddModalOpen(false);
        setNewMember({ name: '', email: '', role: 'Marketing', status: 'active', bio: '', achievements: [], gallery_images: [], country_flag: '🇺🇸' });
    };

    const handleEditClick = (member: TeamMember) => {
        setEditingMember(member);
        setNewMember(member);
        setIsAddModalOpen(true);
    };

    const toggleProjectAccess = (projectId: string, memberId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const currentMembers = project.members || [];
        const newMembers = currentMembers.includes(memberId)
            ? currentMembers.filter(id => id !== memberId)
            : [...currentMembers, memberId];

        updateProject(projectId, { members: newMembers });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-serif-brand">Team & Access</h1>
                    <p className="opacity-60">Manage your organization&apos;s members and project permissions.</p>
                </div>
                {currentUser?.role !== 'Designer' && (
                    <button
                        onClick={() => { setEditingMember(null); setNewMember({ role: 'Marketing', status: 'active', bio: '', achievements: [], gallery_images: [], country_flag: '🇺🇸' }); setIsAddModalOpen(true); }}
                        className="bg-black text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:opacity-90 flex items-center gap-2"
                    >
                        <Plus size={18} /> Invite Member
                    </button>
                )}
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'members' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    <Users size={16} /> Members
                </button>
                <button
                    onClick={() => setActiveTab('access')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'access' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    <Shield size={16} /> Access Matrix
                </button>
            </div>

            {/* MEMBERS VIEW */}
            {activeTab === 'members' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {teamMembers.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <img src={member.avatar_url} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                                            <div>
                                                <p className="font-bold text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {member.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${member.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                member.role === 'Design' ? 'bg-pink-100 text-pink-700' :
                                                    member.role === 'Marketing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                                    `}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-2 text-sm font-medium ${member.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                            {member.status === 'active' ? 'Active' : 'Invited'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEditClick(member)} className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-black"><Edit2 size={16} /></button>
                                            {currentUser?.role !== 'Designer' && (
                                                <button onClick={() => deleteTeamMember(member.id)} className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ACCESS MATRIX VIEW */}
            {activeTab === 'access' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-700">Project Permissions</h3>
                        <p className="text-xs text-gray-500 mt-1">Control who can view and edit specific campaigns.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                <tr>
                                    <th className="px-6 py-4 w-64">Project / Campaign</th>
                                    {teamMembers.map(m => (
                                        <th key={m.id} className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1" title={m.name}>
                                                <img src={m.avatar_url} className="w-8 h-8 rounded-full bg-gray-200" />
                                                <span className="text-[10px] truncate w-16">{m.name.split(' ')[0]}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {projects.map(project => (
                                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{project.icon || '📁'}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{project.name}</p>
                                                    <p className="text-xs text-gray-400 truncate w-48">{project.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {teamMembers.map(m => {
                                            const hasAccess = project.members?.includes(m.id);
                                            return (
                                                <td key={m.id} className="px-4 py-4 text-center">
                                                    <div
                                                        onClick={() => toggleProjectAccess(project.id, m.id)}
                                                        className={`w-6 h-6 mx-auto rounded border flex items-center justify-center cursor-pointer transition-all ${hasAccess ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-50 border-gray-300 text-transparent hover:border-gray-400'}`}
                                                    >
                                                        <Check size={14} />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-[500px] rounded-xl shadow-2xl p-8">
                        <h2 className="text-xl font-bold mb-6">{editingMember ? 'Edit Member' : 'Invite New Member'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Full Name</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder="e.g. Jane Doe"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Email Address</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                                    placeholder="jane@company.com"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Marketing', 'Design', 'Creative', 'Admin'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setNewMember({ ...newMember, role: role as TeamRole })}
                                            className={`py-2 text-sm font-bold rounded-lg border transition-all ${newMember.role === role ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Status</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-white"
                                    value={newMember.status}
                                    onChange={(e) => setNewMember({ ...newMember, status: e.target.value as any })}
                                >
                                    <option value="active">Active</option>
                                    <option value="invited">Invited (Pending)</option>
                                </select>
                            </div>
                        </div>

                        {/* New Fields for Extended Profile */}
                        <div className="space-y-4 mt-4 border-t border-gray-100 pt-4">

                            {/* Avatar & Country */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Profile Photo</label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            onClick={() => avatarFileInputRef.current?.click()}
                                            className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 overflow-hidden relative group"
                                        >
                                            {newMember.avatar_url ? (
                                                <img src={newMember.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={20} className="text-gray-400" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit2 size={12} className="text-white" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={avatarFileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                        />
                                        <div className="text-xs text-gray-400">Click to upload custom avatar.</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Country Flag</label>
                                    <input
                                        className="w-full border border-gray-200 rounded-lg p-3 text-sm text-center"
                                        placeholder="🇺🇸"
                                        maxLength={4}
                                        value={newMember.country_flag || ''}
                                        onChange={(e) => setNewMember({ ...newMember, country_flag: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Bio</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none h-24 resize-none"
                                    placeholder="Short professional bio..."
                                    value={newMember.bio || ''}
                                    onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Top Achievements (One per line)</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none h-24 resize-none"
                                    placeholder="e.g. World Champion 2024&#10;Olympian 2020"
                                    value={Array.isArray(newMember.achievements) ? newMember.achievements.join('\n') : newMember.achievements || ''}
                                    onChange={(e) => setNewMember({ ...newMember, achievements: e.target.value.split('\n') })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Gallery Images</label>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {(newMember.gallery_images || []).map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden group">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeGalleryImage(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => galleryFileInputRef.current?.click()}
                                        className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100"
                                    >
                                        <Plus size={20} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-400">Add</span>
                                    </div>
                                    <input
                                        type="file"
                                        ref={galleryFileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleGalleryUpload}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black">Cancel</button>
                            <button onClick={handleSaveMember} className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90">
                                {editingMember ? 'Save Changes' : 'Send Invite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
