
import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { SocialJob, ContentPost, BrandAsset } from '../types';
import { createSocialJob, uploadAssetForPost, publishJob } from '../services/automation';
import {
    CheckCircle2, Clock, FileEdit, Send, CalendarCheck, Plus, Sparkles,
    Image as ImageIcon, Upload, Eye, MoreHorizontal, Layout, CheckSquare,
    Loader2, AlertCircle
} from 'lucide-react';

type WorkflowStage = 'strategy' | 'design' | 'approval' | 'schedule';

export const ApprovalsPage: React.FC = () => {
    const {
        socialJobs, addSocialJob, updateSocialJob, activeBrandId, brands,
        updateContentPost, addAsset
    } = useAppStore();

    const [activeStage, setActiveStage] = useState<WorkflowStage>('strategy');
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [newJobBrief, setNewJobBrief] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const activeBrand = brands.find(b => b.id === activeBrandId);
    const currentJobs = socialJobs.filter(j => j.brand_id === activeBrandId);

    // --- ACTIONS ---

    const handleCreateJob = async () => {
        if (!activeBrand || !newJobBrief) return;
        setIsGenerating(true);
        try {
            const job = await createSocialJob(activeBrand, newJobBrief, ['Instagram', 'Facebook', 'LinkedIn']);
            addSocialJob(job);
            setIsJobModalOpen(false);
            setNewJobBrief("");
            setActiveStage('design'); // Auto-move to design view to see result
        } catch (e) {
            alert("Failed to create job");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAssetUpload = (jobId: string, postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeBrandId) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const url = reader.result as string;

                // 1. Create Asset Record
                const asset = uploadAssetForPost(activeBrandId, postId, file, url);
                addAsset(asset); // Add to global library

                // 2. Link to Post & Update Status
                const job = socialJobs.find(j => j.id === jobId);
                if (job) {
                    const updatedPosts = job.posts.map(p =>
                        p.id === postId
                            ? { ...p, media_urls: [url], status: 'pending_approval' as const }
                            : p
                    );
                    // Check if all posts in job are ready for approval
                    const allReady = updatedPosts.every(p => p.status === 'pending_approval' || p.status === 'approved');
                    updateSocialJob(jobId, {
                        posts: updatedPosts,
                        status: allReady ? 'approval' : 'design'
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleApprovePost = (jobId: string, postId: string) => {
        const job = socialJobs.find(j => j.id === jobId);
        if (job) {
            const updatedPosts = job.posts.map(p =>
                p.id === postId ? { ...p, status: 'approved' as const } : p
            );
            const allApproved = updatedPosts.every(p => p.status === 'approved');
            updateSocialJob(jobId, {
                posts: updatedPosts,
                status: allApproved ? 'scheduling' : 'approval'
            });
        }
    };

    const handlePublishJob = async (job: SocialJob) => {
        if (confirm(`Publish all ${job.posts.length} posts?`)) {
            const success = await publishJob(job);
            if (success) {
                const updatedPosts = job.posts.map(p => ({ ...p, status: 'published' as const }));
                updateSocialJob(job.id, { posts: updatedPosts, status: 'completed' });
                alert("Published successfully!");
            }
        }
    };

    // --- VIEWS ---

    const StrategyView = () => (
        <div className="space-y-6">
            <div
                onClick={() => setIsJobModalOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Plus size={24} />
                </div>
                <h3 className="font-bold text-lg">New Campaign Brief</h3>
                <p className="text-sm opacity-60 mt-1">Start here. AI will generate copy for all channels.</p>
            </div>

            {currentJobs.filter(j => j.status === 'planning' || j.status === 'copywriting').map(job => (
                <div key={job.id} className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full uppercase font-bold">Generating Copy</span>
                    </div>
                    <p className="text-sm opacity-60 mb-4">{job.brief}</p>
                    <div className="flex gap-2">
                        {job.channels.map(c => (
                            <span key={c} className="text-[10px] border border-gray-200 px-2 py-1 rounded">{c}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const DesignView = () => {
        const designJobs = currentJobs.filter(j => j.status === 'design' || j.status === 'copywriting');

        return (
            <div className="space-y-8">
                {designJobs.length === 0 && (
                    <div className="text-center py-20 text-gray-400">No jobs waiting for design. Great work!</div>
                )}
                {designJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold">{job.title} <span className="text-xs font-normal opacity-50 ml-2">Design Queue</span></h3>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">{job.posts.length} Assets Needed</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {job.posts.map(post => (
                                <div key={post.id} className="p-4 flex gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">{post.platform}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.caption}</p>

                                        {/* Upload Area */}
                                        <div className="relative group w-fit">
                                            {post.media_urls.length > 0 ? (
                                                <div className="relative">
                                                    <img src={post.media_urls[0]} className="h-32 w-auto rounded-lg border border-gray-200" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                                        <label className="cursor-pointer text-white text-xs font-bold flex items-center gap-1">
                                                            <Upload size={12} /> Replace
                                                            <input type="file" className="hidden" onChange={(e) => handleAssetUpload(job.id, post.id, e)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="h-32 w-48 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">
                                                    <ImageIcon className="text-gray-300 mb-2" />
                                                    <span className="text-xs text-gray-500 font-medium">Upload Visual</span>
                                                    <input type="file" className="hidden" onChange={(e) => handleAssetUpload(job.id, post.id, e)} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const ApprovalView = () => {
        const approvalJobs = currentJobs.filter(j => j.status === 'approval');

        return (
            <div className="space-y-8">
                {approvalJobs.length === 0 && (
                    <div className="text-center py-20 text-gray-400">No jobs pending approval.</div>
                )}
                {approvalJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50/50">
                            <h3 className="font-bold">{job.title} <span className="text-xs font-normal opacity-50 ml-2">Review Mode</span></h3>
                            <button className="text-xs font-bold underline">Approve All</button>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                            {job.posts.map(post => (
                                <div key={post.id} className="p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">{post.platform}</span>
                                        {post.status === 'approved' ? (
                                            <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle2 size={12} /> Approved</span>
                                        ) : (
                                            <button
                                                onClick={() => handleApprovePost(job.id, post.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </div>

                                    {post.media_urls.length > 0 && (
                                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
                                            <img src={post.media_urls[0]} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{post.caption}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const ScheduleView = () => {
        const readyJobs = currentJobs.filter(j => j.status === 'scheduling' || j.status === 'completed');

        return (
            <div className="space-y-4">
                {readyJobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-xl border border-black/5 shadow-sm flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold">{job.title}</h3>
                                {job.status === 'completed' && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold">PUBLISHED</span>}
                            </div>
                            <p className="text-xs opacity-60">{job.posts.length} Posts ready for distribution</p>
                        </div>

                        {job.status !== 'completed' && (
                            <div className="flex gap-2">
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                                    <CalendarCheck size={14} /> Schedule
                                </button>
                                <button
                                    onClick={() => handlePublishJob(job)}
                                    className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:opacity-80 flex items-center gap-2"
                                >
                                    <Send size={14} /> Publish Now
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex h-full bg-gray-50">

            {/* Sidebar Navigation */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col pt-6">
                <h2 className="px-6 text-xs font-bold uppercase tracking-wider mb-6 opacity-40">Workflow Stages</h2>
                <nav className="space-y-1 px-3">
                    <button
                        onClick={() => setActiveStage('strategy')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeStage === 'strategy' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Sparkles size={18} />
                        <span>Strategy & Brief</span>
                        <span className="ml-auto bg-white/20 text-white px-2 py-0.5 rounded text-[10px]">{currentJobs.filter(j => j.status === 'planning').length}</span>
                    </button>
                    <button
                        onClick={() => setActiveStage('design')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeStage === 'design' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Layout size={18} />
                        <span>Design Queue</span>
                        <span className="ml-auto bg-gray-200 text-black px-2 py-0.5 rounded text-[10px]">{currentJobs.filter(j => j.status === 'design').length}</span>
                    </button>
                    <button
                        onClick={() => setActiveStage('approval')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeStage === 'approval' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <CheckSquare size={18} />
                        <span>Approvals</span>
                        <span className="ml-auto bg-gray-200 text-black px-2 py-0.5 rounded text-[10px]">{currentJobs.filter(j => j.status === 'approval').length}</span>
                    </button>
                    <button
                        onClick={() => setActiveStage('schedule')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeStage === 'schedule' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Send size={18} />
                        <span>Publisher</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
                <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
                    <h1 className="text-xl font-bold font-serif-brand capitalize">{activeStage} Command Center</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-500">Automation Engine Online</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-5xl mx-auto">
                        {activeStage === 'strategy' && <StrategyView />}
                        {activeStage === 'design' && <DesignView />}
                        {activeStage === 'approval' && <ApprovalView />}
                        {activeStage === 'schedule' && <ScheduleView />}
                    </div>
                </div>
            </div>

            {/* Create Job Modal */}
            {isJobModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-[500px] rounded-xl shadow-2xl p-6">
                        <h3 className="font-bold text-lg mb-4">New Campaign Brief</h3>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-4 text-sm h-32 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Describe the campaign goal, key message, and tone..."
                            value={newJobBrief}
                            onChange={(e) => setNewJobBrief(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsJobModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black">Cancel</button>
                            <button
                                onClick={handleCreateJob}
                                disabled={isGenerating}
                                className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                {isGenerating ? 'Generating...' : 'Launch Automation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalsPage;
