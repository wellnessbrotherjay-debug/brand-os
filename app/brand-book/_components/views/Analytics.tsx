
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, MousePointer, Eye,
    Calendar, Filter, Download, Bell, MessageCircle, Heart, Share2,
    ArrowUpRight, Monitor, Instagram, Facebook, Linkedin, Video
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { MetaConnectModal } from '../components/MetaConnectModal';

const AnalyticsPage: React.FC = () => {
    const { activeBrandId, notifications } = useAppStore();
    const [timeRange, setTimeRange] = useState('28d');
    const [platformFilter, setPlatformFilter] = useState('All');
    const [isConnected, setIsConnected] = useState(false);
    const [isCheckingConnection, setIsCheckingConnection] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);

    // Check if user has connected their Facebook/Instagram account
    useEffect(() => {
        const checkConnection = async () => {
            if (!activeBrandId) {
                setIsConnected(false);
                setIsCheckingConnection(false);
                return;
            }

            try {
                // Try to fetch Facebook Pages to verify connection
                const { getFacebookPages } = await import('../services/metaService');
                const result = await getFacebookPages(activeBrandId);
                setIsConnected(result.success && result.pages.length > 0);
            } catch (error) {
                console.log('[Analytics] No connection found:', error);
                setIsConnected(false);
            } finally {
                setIsCheckingConnection(false);
            }
        };

        checkConnection();
    }, [activeBrandId]);

    const handleConnect = () => {
        setIsConnected(true);
        setShowConnectModal(false);
    };

    // --- MOCK DATA GENERATION ---
    const dailyMetrics = useMemo(() => {
        return Array.from({ length: 28 }, (_, i) => {
            const date = subDays(new Date(), 27 - i);
            return {
                date: format(date, 'MMM dd'),
                impressions: Math.floor(Math.random() * 5000) + 2000,
                reach: Math.floor(Math.random() * 4000) + 1500,
                engagement: Math.floor(Math.random() * 800) + 100,
                clicks: Math.floor(Math.random() * 150) + 20,
            };
        });
    }, []);

    const demographics = [
        { name: '18-24', value: 15 },
        { name: '25-34', value: 45 },
        { name: '35-44', value: 25 },
        { name: '45-54', value: 10 },
        { name: '55+', value: 5 },
    ];

    const topCities = [
        { name: 'New York', value: 35 },
        { name: 'Los Angeles', value: 25 },
        { name: 'London', value: 15 },
        { name: 'Sydney', value: 10 },
        { name: 'Toronto', value: 15 },
    ];

    // --- SUB-COMPONENTS ---

    const KPICard = ({ title, value, change, subtext, icon: Icon, color }: any) => (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
                <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {change >= 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                    {Math.abs(change)}%
                </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{subtext}</p>
        </div>
    );

    const ActivityFeed = () => (
        <div className="bg-white border-l border-gray-200 h-full flex flex-col w-80 shrink-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <Bell size={16} /> Live Activity
                </h3>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Real-time</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {notifications.map(n => (
                    <div key={n.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 cursor-pointer group">
                        <div className="flex gap-3">
                            <div className="relative">
                                <img src={n.avatar_url} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                    {n.platform === 'Instagram' && <div className="w-3 h-3 bg-pink-500 rounded-full" />}
                                    {n.platform === 'Facebook' && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                                    {n.platform === 'LinkedIn' && <div className="w-3 h-3 bg-blue-800 rounded-full" />}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 leading-tight">
                                    <span className="font-bold">{n.user}</span> {n.content}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-gray-50/50">
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">Professional Dashboard</h1>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Data Source: Meta Graph API
                                </span>
                            ) : (
                                <button onClick={() => setShowConnectModal(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                                    <ArrowUpRight size={12} /> Connect Data Source
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['All', 'IG', 'FB', 'LI'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPlatformFilter(p)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${platformFilter === p ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold hover:bg-gray-50">
                            <Calendar size={14} /> Last 28 Days
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Scorecards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPICard title="Total Reach" value="245.8K" change={12.5} subtext="Unique accounts seen" icon={Eye} color="blue" />
                        <KPICard title="Content Interactions" value="18.2K" change={-2.1} subtext="Likes, comments, shares" icon={Heart} color="pink" />
                        <KPICard title="Profile Visits" value="8,490" change={5.4} subtext="Tap-throughs to bio" icon={Users} color="purple" />
                        <KPICard title="Link Clicks" value="1,204" change={24.8} subtext="Website traffic generated" icon={MousePointer} color="green" />
                    </div>

                    {/* Main Graph */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Performance Over Time</h3>
                                <p className="text-xs text-gray-500">Comparing Reach vs. Engagement</p>
                            </div>
                            <div className="flex gap-4 text-xs font-bold">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Reach</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div> Engagement</div>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyMetrics} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} minTickGap={30} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" />
                                    <Area type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorEng)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Demographics */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6">Audience Demographics</h3>
                            <div className="flex gap-4 h-64">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase text-center">Age Distribution</p>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={demographics} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={40} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" fill="#1f2937" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-px bg-gray-100"></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase text-center">Top Cities</p>
                                    <div className="space-y-3 mt-4">
                                        {topCities.map((city, i) => (
                                            <div key={city.name} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">{city.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(city.value / 40) * 100}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-xs w-6">{city.value}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Funnel */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6">Conversion Funnel</h3>
                            <div className="space-y-6 relative">
                                {/* Connector Line */}
                                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10"></div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                                        <Eye size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-sm">Impressions</span>
                                            <span className="font-bold">1.2M</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full w-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                                        <MousePointer size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-sm">Link Clicks</span>
                                            <span className="font-bold">18.5K</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full" style={{ width: '45%' }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">1.54% CTR</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-sm">Conversions</span>
                                            <span className="font-bold">450</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full" style={{ width: '12%' }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">2.4% Conv. Rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Content Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Top Performing Content</h3>
                            <button className="text-xs text-blue-600 font-bold hover:underline">View All Posts</button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3">Content</th>
                                    <th className="px-6 py-3 text-right">Reach</th>
                                    <th className="px-6 py-3 text-right">Engage.</th>
                                    <th className="px-6 py-3 text-right">Saves</th>
                                    <th className="px-6 py-3 text-right">Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[1, 2, 3, 4].map(i => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                <Video size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">Summer Campaign Reel #{i}</p>
                                                <p className="text-xs text-gray-400">Nov {i + 10}, 2025</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{Math.floor(Math.random() * 50)}k</td>
                                        <td className="px-6 py-4 text-right font-mono">{Math.floor(Math.random() * 5)}k</td>
                                        <td className="px-6 py-4 text-right font-mono">{Math.floor(Math.random() * 500)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded">High</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

            {/* Sidebar Activity Feed */}
            <ActivityFeed />

            <MetaConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onConnect={handleConnect} />
        </div>
    );
};

export default AnalyticsPage;
