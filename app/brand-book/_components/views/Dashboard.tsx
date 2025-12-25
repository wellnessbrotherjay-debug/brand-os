
import React from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, CheckCircle2, Circle, Clock, Edit } from 'lucide-react';

export const Dashboard: React.FC<{ setView: (v: any) => void }> = ({ setView }) => {
  const { brands, activeBrandId, strategySections, identities, contentPosts } = useAppStore();

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const currentIdentity = identities.find(i => i.brand_id === activeBrandId);
  const brandStrategy = strategySections.filter(s => s.brand_id === activeBrandId);

  if (!activeBrand) return <div className="p-10">Please select a brand.</div>;

  // Strategy Progress
  const totalStrategySections = 12; // Number of enum values
  const filledSections = brandStrategy.length;
  const strategyProgress = Math.round((filledSections / totalStrategySections) * 100);

  // Identity Progress (simple check)
  const identityFields = [currentIdentity?.logo_primary_url, currentIdentity?.color_primary_hex, currentIdentity?.font_heading, currentIdentity?.image_style];
  const filledIdentity = identityFields.filter(Boolean).length;
  const identityProgress = Math.round((filledIdentity / 4) * 100);

  // Content Stats
  const upcomingPosts = contentPosts.length;

  const mockData = [
    { name: 'Mon', posts: 1 },
    { name: 'Tue', posts: 3 },
    { name: 'Wed', posts: 2 },
    { name: 'Thu', posts: 4 },
    { name: 'Fri', posts: 2 },
    { name: 'Sat', posts: 1 },
    { name: 'Sun', posts: 0 },
  ];

  // Dynamic Card Style
  const cardClass = "bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 flex flex-col justify-between transition-all hover:bg-white/10";
  const textMuted = "opacity-60";
  const textHeading = "font-bold";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {activeBrand.name}</h1>
          <p className={`mt-1 text-base ${textMuted}`}>{activeBrand.tagline || "Let's build your brand."}</p>
        </div>

        {/* Clickable Logo Area */}
        <div
          onClick={() => setView('identity')}
          className="group relative cursor-pointer"
          title="Click to edit logo"
        >
          {currentIdentity?.logo_primary_url ? (
            <img src={currentIdentity.logo_primary_url} alt="Logo" className="h-16 w-auto opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="h-12 w-12 bg-black/5 rounded-full flex items-center justify-center border border-black/10">
              <span className="font-bold text-xs">{activeBrand.name.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-2 right-0 bg-white shadow-md border border-black/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit size={12} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Key Stats Cards */}
        <div className={cardClass}>
          <div>
            <h3 className={`text-sm font-medium uppercase tracking-wide ${textMuted}`}>Strategy Health</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-bold">{strategyProgress}%</span>
              <span className={`mb-1 text-sm ${textMuted}`}>completed</span>
            </div>
          </div>
          <div className="w-full bg-black/5 rounded-full h-2 mt-4">
            <div className="bg-current h-2 rounded-full transition-all duration-500 opacity-80" style={{ width: `${strategyProgress}%` }}></div>
          </div>
        </div>

        <div className={cardClass}>
          <div>
            <h3 className={`text-sm font-medium uppercase tracking-wide ${textMuted}`}>Visual Identity</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-bold">{identityProgress}%</span>
              <span className={`mb-1 text-sm ${textMuted}`}>ready</span>
            </div>
          </div>
          <div className="w-full bg-black/5 rounded-full h-2 mt-4">
            <div className="bg-current h-2 rounded-full transition-all duration-500 opacity-60" style={{ width: `${identityProgress}%` }}></div>
          </div>
        </div>

        <div className={cardClass}>
          <div>
            <h3 className={`text-sm font-medium uppercase tracking-wide ${textMuted}`}>Content Pipeline</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-bold">{upcomingPosts}</span>
              <span className={`mb-1 text-sm ${textMuted}`}>posts scheduled</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setView('ideas')} className="text-xs bg-black text-white px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity">
              Generate Ideas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Setup Checklist */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Action Plan</h2>
            <button onClick={() => setView('setup')} className="text-sm font-medium hover:underline opacity-70">Go to Setup</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/5">
              <CheckCircle2 className="text-green-600 w-5 h-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Brand Basics</p>
                <p className={`text-sm ${textMuted}`}>Core profile setup complete.</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border border-black/5 ${strategyProgress < 100 ? 'bg-white/50' : 'bg-black/5'}`}>
              {strategyProgress === 100 ? <CheckCircle2 className="text-green-600 w-5 h-5" /> : <Circle className="opacity-40 w-5 h-5" />}
              <div className="flex-1">
                <p className="text-sm font-medium">Strategic Foundation</p>
                <p className={`text-sm ${textMuted}`}>Define your UVP, Mission, and Vision.</p>
              </div>
              {strategyProgress < 100 && (
                <button onClick={() => setView('strategy')} className="bg-black text-white px-3 py-1 rounded text-xs hover:opacity-80">
                  Complete
                </button>
              )}
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border border-black/5 ${identityProgress < 100 ? 'bg-white/50' : 'bg-black/5'}`}>
              {identityProgress === 100 ? <CheckCircle2 className="text-green-600 w-5 h-5" /> : <Circle className="opacity-40 w-5 h-5" />}
              <div className="flex-1">
                <p className="text-sm font-medium">Visual Guidelines</p>
                <p className={`text-sm ${textMuted}`}>Set colors, fonts, and style.</p>
              </div>
              {identityProgress < 100 && (
                <button onClick={() => setView('identity')} className="bg-black text-white px-3 py-1 rounded text-xs hover:opacity-80">
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Chart */}
        <div className={cardClass}>
          <h2 className="text-lg font-bold mb-4">Activity This Week</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#000' }}
                />
                <Bar dataKey="posts" radius={[4, 4, 0, 0]}>
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="currentColor" fillOpacity={index % 2 === 0 ? 0.8 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
