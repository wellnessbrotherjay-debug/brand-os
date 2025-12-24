
import React, { useRef, useState } from 'react';
import { useAppStore } from '../store';
import { assessAssetCompliance } from '../services/geminiService';
import { 
    Upload, FileText, Video, MoreHorizontal, Plus, ChevronRight, FolderOpen, 
    Trash2, Calendar, Users, Briefcase, Settings, CheckCircle2, Circle, 
    Grid, Layout, Clock, Filter, AlertCircle, CalendarPlus, X, Image as ImageIcon,
    ScanEye, Loader2, ShieldCheck, Palette, Type, AlertTriangle
} from 'lucide-react';
import { BrandAsset, Project, AssetStatus, AssetComplianceReport, ViewName } from '../types';
import { format, addDays, startOfWeek } from 'date-fns';

type ViewMode = 'library' | 'board' | 'timeline';

export const Assets: React.FC<{ setView: (view: ViewName) => void }> = ({ setView }) => {
  const { assets, addAsset, updateAsset, deleteAsset, activeBrandId, brands, identities, projects, addProject, updateProject, deleteProject, teamMembers, addContentPost } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  const [isAuditing, setIsAuditing] = useState(false);

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const activeIdentity = identities.find(i => i.brand_id === activeBrandId);
  const activeProject = projects.find(p => p.id === activeProjectId);
  
  // Filter assets by project
  const displayAssets = assets.filter(a => {
      if (a.brand_id !== activeBrandId) return false;
      if (activeProjectId) return a.project_id === activeProjectId;
      return true; // Show all if no project selected (Overview)
  });

  const activeProjects = projects.filter(p => p.brand_id === activeBrandId);

  // --- ACTIONS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && activeBrandId) {
          Array.from(e.target.files).forEach((file: File) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                 let assetType: BrandAsset['asset_type'] = 'other';
                 if (file.type.includes('image')) assetType = 'image';
                 else if (file.type.includes('video')) assetType = 'video';
                 else if (file.type.includes('pdf')) assetType = 'pdf';

                 addAsset({
                     id: crypto.randomUUID(),
                     brand_id: activeBrandId,
                     project_id: activeProjectId || undefined,
                     asset_type: assetType,
                     title: file.name,
                     description: 'Uploaded via Workspace',
                     file_url: reader.result as string,
                     tags: ['upload'],
                     status: 'Draft'
                 });
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const handleCreateProject = () => {
      if (!newProjectName.trim() || !activeBrandId) return;
      addProject({
          id: crypto.randomUUID(),
          brand_id: activeBrandId,
          name: newProjectName,
          description: 'New Project',
          status: 'Planning',
          members: [],
          icon: '📁'
      });
      setNewProjectName("");
      setIsCreatingProject(false);
  }

  const toggleTeamMember = (memberId: string) => {
      if (!activeProject) return;
      const currentMembers = activeProject.members || [];
      const newMembers = currentMembers.includes(memberId)
        ? currentMembers.filter(id => id !== memberId)
        : [...currentMembers, memberId];
      
      updateProject(activeProject.id, { members: newMembers });
  };

  const handleSchedule = (asset: BrandAsset) => {
      // Mock schedule to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      addContentPost({
          id: crypto.randomUUID(),
          brand_id: asset.brand_id,
          platform: 'Instagram',
          title: asset.title,
          caption: asset.description,
          media_urls: [asset.file_url],
          scheduled_for: tomorrow.toISOString(),
          status: 'scheduled',
          metrics_views: 0, metrics_likes: 0, metrics_comments: 0, metrics_saves: 0, metrics_shares: 0
      });
      
      updateAsset(asset.id, { status: 'Scheduled', scheduled_date: tomorrow.toISOString() });
      alert("Asset scheduled to calendar!");
  };

  const handleRunAudit = async () => {
      if (!selectedAsset || !activeIdentity) return;
      setIsAuditing(true);
      try {
          const report = await assessAssetCompliance(selectedAsset.file_url, activeIdentity);
          updateAsset(selectedAsset.id, { compliance_report: report });
      } catch (e) {
          console.error(e);
          alert("Audit failed. Please try again.");
      } finally {
          setIsAuditing(false);
      }
  };

  // --- VIEWS ---

  const TeamModal = () => {
      if (!isTeamModalOpen) return null;
      
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-[400px] rounded-xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg">Team Access</h3>
                        <p className="text-xs text-stone-500">{activeProject ? `Managing: ${activeProject.name}` : 'Workspace Members'}</p>
                    </div>
                    <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-full"><X size={18} /></button>
                </div>
                
                <div className="space-y-3 mb-6">
                    {teamMembers.map(member => {
                        const isAssigned = activeProject ? activeProject.members?.includes(member.id) : true;
                        
                        return (
                            <div 
                                key={member.id} 
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeProject ? 'hover:bg-stone-50' : ''}`} 
                                onClick={() => activeProject && toggleTeamMember(member.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={member.avatar_url} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-sm font-bold">{member.name}</p>
                                        <p className="text-xs text-stone-400">{member.role}</p>
                                    </div>
                                </div>
                                {activeProject && (
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isAssigned ? 'bg-black border-black text-white' : 'border-stone-300'}`}>
                                        {isAssigned && <CheckCircle2 size={12} />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <button 
                    onClick={() => { setIsTeamModalOpen(false); setView('team'); }}
                    className="w-full py-2 bg-black text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors"
                >
                    Manage Full Team & Roles
                </button>
            </div>
        </div>
      );
  };

  const LibraryView = () => (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Upload Dropzone Mock */}
          <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-600 cursor-pointer transition-colors bg-stone-50"
          >
              <Plus size={24} className="mb-2" />
              <span className="text-xs font-bold uppercase tracking-wide">Bulk Upload</span>
              <span className="text-[10px] opacity-60 mt-1">Drag & Drop</span>
          </div>

          {displayAssets.map(asset => (
              <div 
                key={asset.id} 
                onClick={() => setSelectedAsset(asset)}
                className="group relative aspect-[4/3] bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer"
              >
                  {asset.asset_type === 'image' ? (
                      <img src={asset.file_url} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-50">
                          {asset.asset_type === 'video' ? <Video size={32} /> : <FileText size={32} />}
                          <span className="text-xs font-medium mt-2 uppercase">{asset.asset_type}</span>
                      </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${asset.status === 'Approved' ? 'bg-green-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                              {asset.status}
                          </span>
                      </div>
                      <div>
                          <p className="text-white text-xs font-bold truncate">{asset.title}</p>
                          <p className="text-white/60 text-[10px]">{new Date().toLocaleDateString()}</p>
                      </div>
                  </div>
                  {/* Compliance Badge */}
                  {asset.compliance_report && (
                      <div className="absolute top-2 left-2">
                          {asset.compliance_report.status === 'PASS' && <CheckCircle2 size={16} className="text-green-500 bg-white rounded-full"/>}
                          {asset.compliance_report.status === 'WARN' && <AlertTriangle size={16} className="text-orange-500 bg-white rounded-full"/>}
                          {asset.compliance_report.status === 'FAIL' && <AlertCircle size={16} className="text-red-500 bg-white rounded-full"/>}
                      </div>
                  )}
              </div>
          ))}
      </div>
  );

  const BoardView = () => {
      const columns: AssetStatus[] = ['Draft', 'In Review', 'Approved', 'Scheduled'];
      
      return (
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
              {columns.map(status => (
                  <div key={status} className="flex-1 min-w-[280px] bg-stone-50 rounded-xl flex flex-col border border-stone-200">
                      <div className="p-3 border-b border-stone-200 flex justify-between items-center font-bold text-xs uppercase tracking-wide text-stone-500">
                          {status}
                          <span className="bg-stone-200 px-2 py-0.5 rounded-full text-[10px] text-stone-600">
                              {displayAssets.filter(a => a.status === status).length}
                          </span>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                          {displayAssets.filter(a => (a.status || 'Draft') === status).map(asset => (
                              <div 
                                key={asset.id} 
                                onClick={() => setSelectedAsset(asset)}
                                className="bg-white p-3 rounded-lg shadow-sm border border-stone-100 cursor-pointer hover:border-stone-300 transition-all group"
                              >
                                  {asset.asset_type === 'image' && (
                                      <div className="h-24 w-full bg-stone-100 rounded mb-2 overflow-hidden relative">
                                          <img src={asset.file_url} className="w-full h-full object-cover" />
                                          {asset.compliance_report?.status === 'PASS' && (
                                              <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full">
                                                  <CheckCircle2 size={10} />
                                              </div>
                                          )}
                                      </div>
                                  )}
                                  <div className="flex justify-between items-start">
                                      <span className="font-medium text-sm text-stone-800 line-clamp-2">{asset.title}</span>
                                      {asset.status !== 'Approved' && status !== 'Scheduled' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); updateAsset(asset.id, { status: 'Approved' }); }}
                                            className="opacity-0 group-hover:opacity-100 text-green-600 hover:bg-green-50 p-1 rounded transition-all"
                                            title="Quick Approve"
                                          >
                                              <CheckCircle2 size={14} />
                                          </button>
                                      )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 uppercase">{asset.asset_type}</span>
                                  </div>
                              </div>
                          ))}
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded flex items-center justify-center gap-1 transition-colors"
                          >
                              <Plus size={12} /> Add Item
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const TimelineView = () => {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const days = Array.from({length: 14}, (_, i) => addDays(weekStart, i)); // 2 weeks view

      return (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col h-full">
              {/* Header Days */}
              <div className="flex border-b border-stone-200">
                  <div className="w-48 shrink-0 p-3 bg-stone-50 border-r border-stone-200 font-bold text-xs text-stone-500 uppercase">Asset Name</div>
                  {days.map(d => (
                      <div key={d.toString()} className="flex-1 min-w-[40px] p-2 text-center border-r border-stone-100 last:border-0 bg-stone-50">
                          <span className="block text-[10px] font-bold text-stone-400 uppercase">{format(d, 'EEE')}</span>
                          <span className="block text-xs font-bold text-stone-700">{format(d, 'd')}</span>
                      </div>
                  ))}
              </div>
              
              {/* Rows */}
              <div className="overflow-y-auto flex-1">
                  {displayAssets.map(asset => (
                      <div key={asset.id} className="flex border-b border-stone-100 hover:bg-stone-50 group">
                          <div className="w-48 shrink-0 p-3 border-r border-stone-200 flex items-center gap-2 overflow-hidden">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.status === 'Approved' ? '#22c55e' : '#e5e7eb' }}></div>
                              <span className="text-sm truncate text-stone-700">{asset.title}</span>
                          </div>
                          {days.map(d => {
                              // Check if asset is scheduled for this day
                              const isScheduled = asset.scheduled_date && new Date(asset.scheduled_date).toDateString() === d.toDateString();
                              return (
                                  <div key={d.toString()} className="flex-1 min-w-[40px] border-r border-stone-100 relative p-1">
                                      {isScheduled && (
                                          <div 
                                            className="h-full w-full bg-blue-500 rounded text-white text-[10px] flex items-center justify-center font-bold cursor-pointer hover:bg-blue-600 transition-colors"
                                            onClick={() => setSelectedAsset(asset)}
                                          >
                                              Post
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
      <div className="flex h-full bg-white text-stone-800">
        
        {/* SIDEBAR: PROJECTS */}
        <div className="w-64 bg-stone-50 border-r border-stone-200 flex flex-col h-full shrink-0">
            <div className="p-4">
                <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                        {activeBrand?.name[0]}
                    </div>
                    <span className="font-bold truncate">{activeBrand?.name}</span>
                </div>

                <div className="space-y-1">
                    <div 
                        onClick={() => setActiveProjectId(null)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors ${!activeProjectId ? 'bg-stone-200 text-black' : 'text-stone-500 hover:bg-stone-100'}`}
                    >
                        <Grid size={16} /> All Assets
                    </div>
                    
                    <h3 className="text-[10px] font-bold text-stone-400 px-3 mt-6 mb-2 uppercase tracking-wider">Campaigns & Folders</h3>
                    {activeProjects.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => setActiveProjectId(p.id)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${activeProjectId === p.id ? 'bg-white border border-stone-200 shadow-sm text-black font-medium' : 'text-stone-600 hover:bg-stone-100 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <span className="opacity-70">{p.icon || '📁'}</span>
                                {p.name}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    
                    {isCreatingProject ? (
                        <div className="px-3 mt-2">
                            <input 
                                autoFocus
                                className="w-full text-sm border border-stone-300 rounded px-2 py-1.5 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-200"
                                placeholder="Campaign Name..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                onBlur={() => setIsCreatingProject(false)}
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsCreatingProject(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-stone-600 w-full text-left mt-1 hover:bg-stone-100 rounded-md transition-colors"
                        >
                            <Plus size={14} /> New Folder
                        </button>
                    )}
                </div>
            </div>
            
            {/* Team Footer */}
            <div className="mt-auto p-4 border-t border-stone-200">
                <div 
                    className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 cursor-pointer hover:text-stone-600"
                    onClick={() => setView('team')}
                >
                    Team Access
                    <Settings size={12} />
                </div>
                <div 
                    className="flex -space-x-2 overflow-hidden p-1 cursor-pointer"
                    onClick={() => setIsTeamModalOpen(true)}
                >
                    {teamMembers.slice(0, 4).map(m => (
                        <img key={m.id} src={m.avatar_url} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" alt={m.name} title={m.name} />
                    ))}
                    <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold ring-2 ring-white text-stone-500 hover:bg-stone-300">+</div>
                </div>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* Header */}
            <div className="h-16 border-b border-stone-200 px-6 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">{activeProject ? activeProject.name : 'Asset Library'}</h1>
                    <div className="h-6 w-px bg-stone-200"></div>
                    
                    {/* View Switcher */}
                    <div className="flex bg-stone-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('library')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'library' ? 'bg-white shadow-sm text-black' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Grid size={14} /> Library
                        </button>
                        <button 
                            onClick={() => setViewMode('board')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-black' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Layout size={14} /> Board
                        </button>
                        <button 
                            onClick={() => setViewMode('timeline')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-black' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            <Clock size={14} /> Timeline
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="p-2 hover:bg-stone-100 rounded-full text-stone-500"><Filter size={18} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Add Assets
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30">
                {viewMode === 'library' && <LibraryView />}
                {viewMode === 'board' && <BoardView />}
                {viewMode === 'timeline' && <TimelineView />}
            </div>

            {/* ASSET DETAIL DRAWER */}
            {selectedAsset && (
                <div className="absolute top-0 right-0 h-full w-[400px] bg-white border-l border-stone-200 shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${selectedAsset.status === 'Approved' ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                            <span className="font-bold text-sm text-stone-600 uppercase tracking-wide">{selectedAsset.status}</span>
                        </div>
                        <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-stone-200 rounded-full"><X size={18} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Preview */}
                        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden mb-6 border border-stone-200 flex items-center justify-center relative">
                            {selectedAsset.asset_type === 'image' ? (
                                <img src={selectedAsset.file_url} className="w-full h-full object-contain" />
                            ) : (
                                <FileText size={48} className="text-stone-300" />
                            )}
                            {selectedAsset.compliance_report && (
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-2 border border-black/5">
                                    <ShieldCheck size={14} className={selectedAsset.compliance_report.status === 'PASS' ? 'text-green-600' : 'text-orange-500'} />
                                    <span className="text-xs font-bold">{selectedAsset.compliance_report.score}% On Brand</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Title</label>
                                <input 
                                    className="w-full font-bold text-lg border-none p-0 focus:ring-0 text-stone-900" 
                                    value={selectedAsset.title}
                                    onChange={(e) => updateAsset(selectedAsset.id, { title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Description</label>
                                <textarea 
                                    className="w-full text-sm border-stone-200 rounded-lg focus:ring-stone-200 focus:border-stone-400 min-h-[80px]" 
                                    value={selectedAsset.description}
                                    onChange={(e) => updateAsset(selectedAsset.id, { description: e.target.value })}
                                />
                            </div>

                            {/* Brand Guardrails AI */}
                            <div className={`p-4 rounded-xl border transition-all ${selectedAsset.compliance_report ? (selectedAsset.compliance_report.status === 'PASS' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100') : 'bg-blue-50 border-blue-100'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={`font-bold text-sm flex items-center gap-2 ${selectedAsset.compliance_report ? (selectedAsset.compliance_report.status === 'PASS' ? 'text-green-900' : 'text-orange-900') : 'text-blue-900'}`}>
                                        {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <ScanEye size={16} />} 
                                        Brand Guardrails
                                    </h3>
                                    {selectedAsset.compliance_report ? (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedAsset.compliance_report.status === 'PASS' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                                            {selectedAsset.compliance_report.status}
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={handleRunAudit}
                                            className="text-xs bg-white/50 hover:bg-white text-blue-800 px-3 py-1 rounded-full font-bold transition-colors"
                                        >
                                            Run Audit
                                        </button>
                                    )}
                                </div>
                                
                                {selectedAsset.compliance_report ? (
                                    <div className="space-y-3">
                                        <p className="text-xs opacity-80 leading-relaxed italic border-l-2 pl-2 border-black/10">
                                            "{selectedAsset.compliance_report.ai_feedback}"
                                        </p>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center justify-between opacity-80">
                                                <div className="flex items-center gap-2"><Palette size={12}/> Color Palette</div>
                                                {selectedAsset.compliance_report.checks.colors.passed ? <CheckCircle2 size={14} className="text-green-600"/> : <AlertCircle size={14} className="text-red-500"/>}
                                            </div>
                                            <div className="flex items-center justify-between opacity-80">
                                                <div className="flex items-center gap-2"><Type size={12}/> Typography</div>
                                                {selectedAsset.compliance_report.checks.typography.passed ? <CheckCircle2 size={14} className="text-green-600"/> : <AlertCircle size={14} className="text-red-500"/>}
                                            </div>
                                            <div className="flex items-center justify-between opacity-80">
                                                <div className="flex items-center gap-2"><ImageIcon size={12}/> Visual Vibe</div>
                                                {selectedAsset.compliance_report.checks.visual_style.passed ? <CheckCircle2 size={14} className="text-green-600"/> : <AlertCircle size={14} className="text-red-500"/>}
                                            </div>
                                        </div>
                                        <button onClick={handleRunAudit} className="w-full mt-2 text-[10px] text-center opacity-50 hover:opacity-100 hover:underline">Re-run Analysis</button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-blue-800/70">
                                        Run an AI audit to check if this asset matches the {activeBrand?.name} brand identity.
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
                                <select 
                                    className="w-full text-xs font-bold border-stone-200 rounded-lg py-2.5 bg-stone-50"
                                    value={selectedAsset.status || 'Draft'}
                                    onChange={(e) => updateAsset(selectedAsset.id, { status: e.target.value as AssetStatus })}
                                >
                                    <option>Draft</option>
                                    <option>In Review</option>
                                    <option>Approved</option>
                                </select>
                                
                                <button 
                                    onClick={() => handleSchedule(selectedAsset)}
                                    className="w-full bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90"
                                >
                                    <CalendarPlus size={14} /> Schedule
                                </button>
                            </div>
                            
                            <div className="pt-2 text-center">
                                <button 
                                    onClick={() => {
                                        if(confirm("Delete this asset?")) {
                                            deleteAsset(selectedAsset.id);
                                            setSelectedAsset(null);
                                        }
                                    }}
                                    className="text-red-400 text-xs hover:text-red-600 font-medium"
                                >
                                    Delete Asset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <TeamModal />
      </div>
  );
}
