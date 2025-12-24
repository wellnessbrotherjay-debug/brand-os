
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { analyzeMarketingPlan, generateCampaignVisual, generateMarketingPlan, generateMindMapFromText, generateActionPlan, MindMapNode, ActionItem } from '../services/geminiService';
import { Wand2, Target, Calendar, TrendingUp, Download, CheckCircle2, Upload, FileText, Image as ImageIcon, Sparkles, Loader2, Clipboard, ChevronRight, RefreshCw, Play, Network, Plus, ZoomIn, ZoomOut, Move, Grid, List, Layers, Users, Clock } from 'lucide-react';

export const MarketingStrategy: React.FC = () => {
  const { activeBrandId, brands } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'visuals' | 'mindmap' | 'actions'>('plan');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [pastedText, setPastedText] = useState("");
  
  // Mind Map State
  const [mapNodes, setMapNodes] = useState<MindMapNode[]>([]);
  const [mapScale, setMapScale] = useState(0.8);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Action Plan State
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputs, setInputs] = useState({
      goal: 'Brand Awareness',
      budget: '$5,000',
      duration: '90 Days',
      focus: 'Social Media Growth'
  });

  const activeBrand = brands.find(b => b.id === activeBrandId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = async () => {
              const text = reader.result as string;
              setPastedText(text);
              await handleAnalyze(text);
          };
          reader.readAsText(file);
      }
  };

  const handleAnalyze = async (text: string) => {
      setLoading(true);
      try {
          const analysis = await analyzeMarketingPlan(text);
          setInputs({
              goal: analysis.goal || inputs.goal,
              budget: analysis.budget || inputs.budget,
              duration: analysis.duration || inputs.duration,
              focus: analysis.focus || inputs.focus
          });
          // Set the raw text as the initial strategy so they can see what they pasted
          if (!strategy) setStrategy(text);
      } catch (err) {
          console.error("Failed to analyze plan", err);
      } finally {
          setLoading(false);
      }
  };

  const handleGeneratePlan = async () => {
      if (!activeBrand) return;
      setGenerating(true);
      try {
          const newPlan = await generateMarketingPlan(activeBrand, inputs);
          setStrategy(newPlan);
      } catch (e) {
          alert("Failed to generate plan.");
      } finally {
          setGenerating(false);
      }
  };

  const handleGenerateMindMap = async () => {
      if (!strategy) return alert("Generate a strategy first.");
      setLoading(true);
      setActiveTab('mindmap');
      try {
          const nodes = await generateMindMapFromText(strategy);
          // Initial Layout Calculation
          const layoutNodes = calculateTreeLayout(nodes);
          setMapNodes(layoutNodes);
      } catch (e) {
          alert("Failed to build mind map.");
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateActionPlan = async () => {
      if (!strategy) return alert("Generate a strategy first.");
      setLoading(true);
      try {
          const items = await generateActionPlan(strategy);
          setActionItems(items);
      } catch (e) {
          alert("Failed to generate action plan.");
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateVisual = async (phase: string) => {
      if (!activeBrand || !strategy) return;
      setImageLoading(true);
      try {
          const imageUrl = await generateCampaignVisual(activeBrand, strategy, phase);
          if (imageUrl) {
              setGeneratedImages(prev => [imageUrl, ...prev]);
              setActiveTab('visuals');
          }
      } catch (e) {
          alert("Failed to generate image.");
      } finally {
          setImageLoading(false);
      }
  };

  // --- MIND MAP LOGIC (RECURSIVE LAYOUT) ---

  const calculateTreeLayout = (nodes: MindMapNode[]) => {
      if (nodes.length === 0) return [];
      
      const newNodes = [...nodes];
      const root = newNodes.find(n => n.type === 'root') || newNodes[0];
      
      // Constants
      const LEVEL_HEIGHT = 150;
      const NODE_WIDTH = 220;
      const PADDING = 40;

      // Recursive helper to assign subtree width and positions
      const calculateSubtree = (nodeId: string, depth: number, startX: number): number => {
          const children = newNodes.filter(n => n.parentId === nodeId);
          
          // Base case: Leaf node
          if (children.length === 0) {
              const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
              if (nodeIdx > -1) {
                  newNodes[nodeIdx] = {
                      ...newNodes[nodeIdx],
                      x: startX + NODE_WIDTH / 2,
                      y: depth * LEVEL_HEIGHT
                  };
              }
              return NODE_WIDTH + PADDING;
          }

          // Recursive case
          let currentX = startX;
          let totalWidth = 0;

          children.forEach(child => {
              const childWidth = calculateSubtree(child.id, depth + 1, currentX);
              currentX += childWidth;
              totalWidth += childWidth;
          });

          // Position parent in the middle of its children
          const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
          if (nodeIdx > -1) {
              newNodes[nodeIdx] = {
                  ...newNodes[nodeIdx],
                  x: startX + (totalWidth - PADDING) / 2, // Center relative to children span
                  y: depth * LEVEL_HEIGHT
              };
          }

          return totalWidth;
      };

      // Start calculation from root
      calculateSubtree(root.id, 1, 0);
      
      // Center the whole tree on standard view if possible
      // (Optional shift logic could go here)

      return newNodes;
  };

  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setDragNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (dragNode) {
          const canvasRect = canvasRef.current?.getBoundingClientRect();
          if (!canvasRect) return;
          
          const x = (e.clientX - canvasRect.left - mapOffset.x) / mapScale;
          const y = (e.clientY - canvasRect.top - mapOffset.y) / mapScale;

          setMapNodes(prev => prev.map(n => n.id === dragNode ? { ...n, x, y } : n));
      }
  };

  const handleMouseUp = () => {
      setDragNode(null);
  };

  const updateNodeLabel = (id: string, label: string) => {
      setMapNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));
  };

  const addChildNode = (parentId: string) => {
      const parent = mapNodes.find(n => n.id === parentId);
      if (!parent) return;
      
      const newNode: MindMapNode = {
          id: crypto.randomUUID(),
          label: 'New Task',
          type: 'task',
          parentId: parentId,
          x: (parent.x || 0),
          y: (parent.y || 0) + 150,
          time: 'TBD'
      };
      setMapNodes([...mapNodes, newNode]);
  };

  const reorganizeMap = () => {
      const layoutNodes = calculateTreeLayout(mapNodes);
      setMapNodes(layoutNodes);
  }

  const MindMapView = () => {
      const connections = useMemo(() => {
          return mapNodes.filter(n => n.parentId).map(child => {
              const parent = mapNodes.find(p => p.id === child.parentId);
              if (!parent || !child.x || !child.y || !parent.x || !parent.y) return null;
              
              // Smooth bezier curves
              const startX = parent.x;
              const startY = parent.y + 40;
              const endX = child.x;
              const endY = child.y - 40;
              
              const pathData = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;

              return (
                  <path 
                    key={`${parent.id}-${child.id}`}
                    d={pathData}
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    fill="none"
                  />
              );
          });
      }, [mapNodes]);

      return (
          <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                      <button 
                        onClick={reorganizeMap}
                        className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-100 text-gray-600"
                        title="Auto-arrange nodes"
                      >
                          <Layers size={14} /> Re-Organize
                      </button>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setMapScale(s => Math.max(0.2, s - 0.1))} className="p-2 hover:bg-gray-200 rounded"><ZoomOut size={16}/></button>
                      <button onClick={() => setMapScale(1)} className="px-2 text-xs font-mono">{Math.round(mapScale * 100)}%</button>
                      <button onClick={() => setMapScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-gray-200 rounded"><ZoomIn size={16}/></button>
                  </div>
              </div>

              <div 
                ref={canvasRef}
                className="flex-1 bg-slate-50 relative overflow-hidden cursor-grab active:cursor-grabbing border border-gray-200 rounded-lg"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                  {/* Grid Background */}
                  <div className="absolute inset-0 pointer-events-none opacity-5" 
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  </div>

                  <div 
                    className="absolute inset-0 origin-top-left transition-transform duration-75"
                    style={{ transform: `scale(${mapScale}) translate(${mapOffset.x}px, ${mapOffset.y}px)` }}
                  >
                      <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none" style={{ overflow: 'visible' }}>
                          {connections}
                      </svg>

                      {mapNodes.map(node => (
                          <div
                            key={node.id}
                            className={`absolute w-[200px] bg-white rounded-lg shadow-md border-2 p-3 transition-shadow hover:shadow-xl cursor-move -translate-x-1/2 -translate-y-1/2
                                ${node.type === 'root' ? 'border-purple-500 bg-purple-50' : 
                                    node.type === 'phase' ? 'border-blue-400' : 'border-gray-200'}
                            `}
                            style={{ left: node.x, top: node.y }}
                            onMouseDown={(e) => handleDragStart(e, node.id)}
                            onDoubleClick={() => setEditingNode(node.id)}
                          >
                              {editingNode === node.id ? (
                                  <input 
                                    autoFocus
                                    className="w-full text-sm border-b border-black outline-none bg-transparent"
                                    value={node.label}
                                    onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                                    onBlur={() => setEditingNode(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingNode(null)}
                                  />
                              ) : (
                                  <>
                                      <div className="text-xs font-bold uppercase opacity-50 mb-1 flex justify-between">
                                          {node.type}
                                          {node.time && <span className="text-[10px] bg-gray-100 px-1 rounded">{node.time}</span>}
                                      </div>
                                      <div className="text-sm font-medium leading-snug">{node.label}</div>
                                      
                                      {/* Add Child Button */}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); addChildNode(node.id); }}
                                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 shadow-sm z-10 transition-opacity"
                                      >
                                          <Plus size={12} className="text-gray-500"/>
                                      </button>
                                  </>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const ActionPlanView = () => {
      // Group actions by Phase for the Gantt view
      const phases = Array.from(new Set(actionItems.map(i => i.phase)));

      return (
          <div className="h-full flex flex-col p-6">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-xl font-bold">Project Action Plan</h2>
                      <p className="text-sm opacity-60">Team assignments and timeline.</p>
                  </div>
                  {actionItems.length === 0 ? (
                      <button 
                        onClick={handleGenerateActionPlan}
                        disabled={loading}
                        className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 flex items-center gap-2"
                      >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                          Generate Team Tasks
                      </button>
                  ) : (
                      <div className="flex gap-2">
                          <button className="bg-white border border-gray-200 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2">
                              <Download size={14} /> Export CSV
                          </button>
                      </div>
                  )}
              </div>

              {actionItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-gray-200 rounded-xl">
                      <List size={48} className="mb-4" />
                      <p className="font-bold">No Actions Generated</p>
                      <p className="text-sm">Click the button above to convert your strategy into tasks.</p>
                  </div>
              ) : (
                  <div className="flex-1 overflow-y-auto space-y-8">
                      {/* Timeline / Gantt Visualization */}
                      <div className="bg-white border border-black/5 rounded-xl p-6 shadow-sm">
                          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 opacity-60">Phase Timeline</h3>
                          <div className="space-y-4">
                              {phases.map((phase, idx) => (
                                  <div key={phase}>
                                      <div className="flex justify-between text-xs font-bold mb-1">
                                          <span>{phase}</span>
                                          <span className="opacity-50">Duration: {actionItems.find(i => i.phase === phase)?.timeline || 'Flexible'}</span>
                                      </div>
                                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 opacity-80" 
                                            style={{ width: '100%', marginLeft: `${idx * 15}%`, maxWidth: `${100 - (idx*15)}%` }} // Mock Gantt Stagger
                                          ></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Task Table */}
                      <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-200">
                                  <tr>
                                      <th className="px-6 py-3">Task</th>
                                      <th className="px-6 py-3">Role</th>
                                      <th className="px-6 py-3">Phase</th>
                                      <th className="px-6 py-3">Timing</th>
                                      <th className="px-6 py-3 text-right">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {actionItems.map(item => (
                                      <tr key={item.id} className="hover:bg-gray-50 group">
                                          <td className="px-6 py-3 font-medium">{item.task}</td>
                                          <td className="px-6 py-3">
                                              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
                                                  ${item.role === 'Manager' ? 'bg-purple-100 text-purple-700' : 
                                                    item.role === 'Designer' ? 'bg-pink-100 text-pink-700' :
                                                    item.role === 'Copywriter' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                                              `}>
                                                  {item.role}
                                              </span>
                                          </td>
                                          <td className="px-6 py-3 opacity-60 text-xs">{item.phase}</td>
                                          <td className="px-6 py-3 opacity-60 text-xs font-mono">{item.timeline}</td>
                                          <td className="px-6 py-3 text-right">
                                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button className="text-green-600 hover:bg-green-50 p-1 rounded"><CheckCircle2 size={16}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold font-serif-brand">Marketing Strategy Engine</h1>
                <p className="opacity-60">Import rough notes, extract key data, and generate professional campaign plans.</p>
            </div>
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.csv" onChange={handleFileUpload} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-gray-200 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 flex items-center gap-2"
                >
                    <Upload size={16} /> Upload Doc
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Input Source */}
                <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider opacity-80"><Clipboard size={16}/> Input Source</h3>
                    <p className="text-xs opacity-50 mb-3">Paste a ChatGPT export, rough meeting notes, or an existing brief.</p>
                    <textarea 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[150px] mb-4 focus:ring-2 focus:ring-black focus:border-transparent resize-y bg-gray-50"
                        placeholder="e.g. 'We want to launch a summer campaign for our new swimsuits. Budget is around 5k. Focus on Instagram and TikTok...'"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                    />
                    
                    <button 
                        onClick={() => handleAnalyze(pastedText)}
                        disabled={loading || !pastedText}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16}/> : <Target size={16}/>}
                        {loading ? "Analyzing..." : "Extract Parameters"}
                    </button>
                </div>

                {/* Extracted Parameters */}
                <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider opacity-80"><Target size={16}/> Strategy Params</h3>
                        {strategy && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Primary Goal</label>
                            <input 
                                className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-black focus:outline-none"
                                value={inputs.goal}
                                onChange={(e) => setInputs({...inputs, goal: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Budget Estimate</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-black focus:outline-none"
                                value={inputs.budget}
                                onChange={(e) => setInputs({...inputs, budget: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Timeline</label>
                            <input 
                                className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-black focus:outline-none"
                                value={inputs.duration}
                                onChange={(e) => setInputs({...inputs, duration: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Key Focus</label>
                            <input 
                                className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-black focus:outline-none"
                                value={inputs.focus}
                                onChange={(e) => setInputs({...inputs, focus: e.target.value})}
                            />
                        </div>

                        <div className="pt-4 border-t border-black/5 mt-4 space-y-2">
                            <button 
                                onClick={handleGeneratePlan}
                                disabled={generating}
                                className="w-full bg-black text-white py-3 rounded-lg font-bold shadow-lg hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
                            >
                                {generating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                                {generating ? 'Generating Plan...' : 'Generate Full Strategy'}
                            </button>
                            
                            <button 
                                onClick={handleGenerateMindMap}
                                disabled={!strategy || loading}
                                className="w-full bg-white border border-gray-200 text-black py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2 text-xs"
                            >
                                <Network size={14}/> Visualize as Mind Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: OUTPUT */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden flex flex-col h-[700px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button 
                        onClick={() => setActiveTab('plan')}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'plan' ? 'border-b-2 border-black bg-white text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <FileText size={16} /> Strategy Doc
                    </button>
                    <button 
                        onClick={() => setActiveTab('mindmap')}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'mindmap' ? 'border-b-2 border-black bg-white text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <Network size={16} /> Mind Map
                    </button>
                    <button 
                        onClick={() => { setActiveTab('actions'); handleGenerateActionPlan(); }}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'actions' ? 'border-b-2 border-black bg-white text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <List size={16} /> Action Plan
                    </button>
                    <button 
                        onClick={() => setActiveTab('visuals')}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'visuals' ? 'border-b-2 border-black bg-white text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <ImageIcon size={16} /> Campaign Visuals
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 relative">
                    {activeTab === 'plan' ? (
                        strategy ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 p-8">
                                <div className="flex justify-between items-start mb-6 border-b border-black/5 pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-2">
                                    <div>
                                        <h2 className="text-xl font-bold">Strategy Roadmap</h2>
                                        <p className="text-xs opacity-50 mt-1">Generated for {activeBrand?.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-xs flex items-center gap-1 font-bold opacity-60 hover:opacity-100 border px-2 py-1 rounded">
                                            <Download size={12} /> Export PDF
                                        </button>
                                        <button 
                                            onClick={() => handleGenerateVisual('Phase 1')}
                                            className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <Sparkles size={14} /> Visualize Phase 1
                                        </button>
                                    </div>
                                </div>

                                <div className="prose prose-sm max-w-none prose-headings:font-serif-brand">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 bg-transparent border-none p-0 focus:outline-none">
                                        {strategy}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8">
                                <TrendingUp size={48} className="mb-4" />
                                <p className="text-lg font-medium">Ready to strategize.</p>
                                <p className="text-sm">Paste a plan on the left or click "Generate Full Strategy" to begin.</p>
                            </div>
                        )
                    ) : activeTab === 'mindmap' ? (
                        mapNodes.length > 0 ? (
                            <MindMapView />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8">
                                <Network size={48} className="mb-4" />
                                <p className="text-lg font-medium">No Map Generated</p>
                                <p className="text-sm">Generate a strategy first, then click "Visualize as Mind Map".</p>
                            </div>
                        )
                    ) : activeTab === 'actions' ? (
                        <ActionPlanView />
                    ) : (
                        <div className="h-full p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">AI Generated Campaign Assets</h3>
                                <button 
                                    onClick={() => handleGenerateVisual('General Campaign')}
                                    disabled={imageLoading}
                                    className="bg-black text-white px-4 py-2 rounded text-xs font-bold hover:opacity-90 flex items-center gap-2"
                                >
                                    {imageLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                                    Generate New Visual
                                </button>
                            </div>
                            
                            {generatedImages.length > 0 ? (
                                <div className="grid grid-cols-2 gap-6">
                                    {generatedImages.map((img, idx) => (
                                        <div key={idx} className="group relative rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-50">
                                            <img src={img} className="w-full h-auto object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                                <p className="text-white text-xs font-medium text-center">AI generated concept based on strategy context.</p>
                                                <div className="flex gap-2">
                                                    <button className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100">Download</button>
                                                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700">Use in Ad</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <ImageIcon size={48} className="mb-4" />
                                    <p className="text-sm font-medium">No visuals generated yet.</p>
                                    <p className="text-xs">Click "Visualize" on the Strategy tab or use the button above.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
