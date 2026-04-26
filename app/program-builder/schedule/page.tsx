"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Orbitron, Outfit } from "next/font/google";
import { ChevronLeft, Calendar, Plus, Trash2, Clock, MapPin, Search } from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-orbitron" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-outfit" });

const FontStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .font-sans { font-family: var(--font-outfit), sans-serif; }
    .font-accent { font-family: var(--font-orbitron), sans-serif; }
    
    .bg-dark-grid {
      background-color: #0c0c0c;
      background-image: 
        linear-gradient(rgba(200, 168, 113, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200, 168, 113, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .glass-card {
      background: rgba(20, 20, 20, 0.4);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }

    .border-gold-glow {
      border: 1px solid rgba(200, 168, 113, 0.15);
      transition: all 0.3s ease;
    }
    .border-gold-glow:hover {
      border-color: rgba(200, 168, 113, 0.4);
      box-shadow: 0 0 20px rgba(200, 168, 113, 0.1);
    }
  `}} />
);

export default function SchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    program_id: "",
    workout_id: "",
    studio_id: "studio-a",
    start_time: "07:00",
    workout_name: ""
  });

  const gold = "#C8A871";

  // Load programs & existing schedules
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Load New Programs
      const { data: progs } = await supabaseClient.from("programs").select("id, name");
      
      // Load Legacy Templates
      const { data: legacys } = await supabaseClient
        .from("workouts")
        .select("id, name, data")
        .eq("is_template", true);

      const combined = [
        ...(progs || []).map((p: any) => ({ ...p, type: 'program' })),
        ...(legacys || []).map((l: any) => ({ ...l, type: 'workout' }))
      ] as any[];
      setPrograms(combined);

      // Load specific day schedules
      const res = await fetch(`/api/schedules?day=${selectedDate}`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
      
      setLoading(false);
    };
    loadData();
  }, [selectedDate]);

  const handleAddSession = async () => {
    if (!newSession.program_id && !newSession.workout_id) return;
    
    // Auto-fill workout name from program name if blank
    const selected = programs.find(p => p.id === (newSession.program_id || newSession.workout_id));
    const payload = {
      ...newSession,
      scheduled_day: selectedDate,
      workout_name: newSession.workout_name || selected?.name || "Workout"
    };

    if (editingId) {
      // Logic for editing (currently we just delete and re-add for simplicity or add PUT)
      await fetch(`/api/schedules?id=${editingId}`, { method: "DELETE" });
    }

    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Reset and reload
    setIsAdding(false);
    setEditingId(null);
    setNewSession({
      program_id: "",
      workout_id: "",
      studio_id: "studio-a",
      start_time: "07:00",
      workout_name: ""
    });
    
    // Refresh list
    const res = await fetch(`/api/schedules?day=${selectedDate}`);
    const data = await res.json();
    setSchedules(data);
  };

  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleEditSession = (session: any) => {
    setEditingId(session.id);
    setNewSession({
      program_id: session.program_id || "",
      workout_id: session.workout_id || "",
      studio_id: session.studio_id,
      start_time: session.start_time.slice(0,5),
      workout_name: session.workout_name
    });
    setIsAdding(true);
  };

  const studioAClasses = useMemo(() => schedules.filter(s => s.studio_id === 'studio-a'), [schedules]);
  const studioBClasses = useMemo(() => schedules.filter(s => s.studio_id === 'studio-b'), [schedules]);

  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className={`min-h-screen bg-dark-grid text-[#F1EDE5] ${orbitron.variable} ${outfit.variable} font-sans p-8 md:p-12 overflow-x-hidden`}>
      <FontStyles />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] uppercase opacity-40 hover:opacity-100 transition-opacity">
            <ChevronLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-6">
            <Calendar size={48} className="text-[#C8A871] opacity-30" />
            <div>
              <h1 className="font-accent text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Class Scheduler</h1>
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#C8A871] opacity-60">Studio Management Hub</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="relative group">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-black/40 border border-[#C8A871]/20 rounded-xl px-6 py-4 font-accent text-lg font-bold outline-none focus:border-[#C8A871]/60 transition-all text-[#C8A871]"
              />
              <div className="absolute -top-3 left-4 bg-[#0c0c0c] px-2 text-[8px] font-black uppercase tracking-widest text-[#C8A871]">Select Date</div>
           </div>
           <button 
             onClick={() => setIsAdding(true)}
             className="px-8 py-4 bg-[#C8A871] text-[#0c0c0c] rounded-xl font-accent text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-3"
           >
             <Plus size={18} /> Schedule Session
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* STUDIO A COLUMN */}
        <section className="flex flex-col gap-6">
           <div className="flex items-center justify-between pb-4 border-b border-[#C8A871]/20">
              <h2 className="font-accent text-lg font-black tracking-[0.3em] uppercase">Studio A <span className="text-[#C8A871]/40 mx-2">/</span> <span className="opacity-40 text-sm font-bold">Standard</span></h2>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{studioAClasses.length} SESSIONS</span>
           </div>
           <div className="grid gap-4">
              {studioAClasses.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">NO WORKOUTS SCHEDULED</div>
              ) : (
                studioAClasses.map((s) => (
                   <SessionCard key={s.id} session={s} onDelete={handleDeleteSession} onEdit={handleEditSession} />
                ))
              )}
           </div>
        </section>

        {/* STUDIO B COLUMN */}
        <section className="flex flex-col gap-6">
           <div className="flex items-center justify-between pb-4 border-b border-[#C8A871]/20">
              <h2 className="font-accent text-lg font-black tracking-[0.3em] uppercase">Studio B <span className="text-[#C8A871]/40 mx-2">/</span> <span className="opacity-40 text-sm font-bold">Class-Based</span></h2>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{studioBClasses.length} SESSIONS</span>
           </div>
           <div className="grid gap-4">
              {studioBClasses.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">NO WORKOUTS SCHEDULED</div>
              ) : (
                studioBClasses.map((s) => (
                   <SessionCard key={s.id} session={s} onDelete={handleDeleteSession} onEdit={handleEditSession} />
                ))
              )}
           </div>
        </section>
      </div>

      {/* Add/Edit Session Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setIsAdding(false); setEditingId(null); }} />
           <div className="relative glass-card w-full max-w-lg rounded-[2rem] p-8 border border-[#C8A871]/30">
              <h3 className="font-accent text-2xl font-black uppercase tracking-tighter mb-8 text-[#C8A871]">
                {editingId ? 'Edit Session' : 'New Session Schedule'}
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-2">Studio</label>
                    <div className="grid grid-cols-2 gap-4">
                       {['studio-a', 'studio-b'].map(sId => (
                          <button key={sId} onClick={() => setNewSession({...newSession, studio_id: sId})} 
                             className={`py-4 rounded-xl font-accent text-[10px] font-black uppercase tracking-widest border transition-all ${newSession.studio_id === sId ? 'bg-[#C8A871] text-[#0c0c0c] border-[#C8A871]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}>
                             {sId === 'studio-a' ? 'Studio A' : 'Studio B'}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-2">Time Slot</label>
                    <div className="relative">
                       <input type="time" value={newSession.start_time} onChange={(e) => setNewSession({...newSession, start_time: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-accent text-lg font-bold outline-none focus:border-[#C8A871]/40 transition-all text-white" />
                       <Clock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 text-[#C8A871]" />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-2">Assign Workout Template</label>
                    <select 
                       value={newSession.program_id || newSession.workout_id} 
                       onChange={(e) => {
                          const val = e.target.value;
                          const selected = programs.find(p => p.id === val);
                          if (selected?.type === 'program') {
                             setNewSession({...newSession, program_id: val, workout_id: ""});
                          } else {
                             setNewSession({...newSession, workout_id: val, program_id: ""});
                          }
                       }}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-accent text-xs font-black uppercase tracking-widest outline-none focus:border-[#C8A871]/40 transition-all text-white appearance-none">
                       <option value="" className="bg-black">Choose Program...</option>
                       {programs.map(p => (
                          <option key={p.id} value={p.id} className="bg-black">
                             {p.type === 'program' ? '[P] ' : '[T] '} {p.name}
                          </option>
                       ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-2">Display Name (Optional)</label>
                    <input type="text" placeholder="e.g. HIIT Power Hour" value={newSession.workout_name} onChange={(e) => setNewSession({...newSession, workout_name: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-sans text-sm font-bold outline-none focus:border-[#C8A871]/40 transition-all text-white" />
                 </div>
              </div>

              <div className="mt-10 flex gap-4">
                 <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-4 rounded-xl font-accent text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                 <button onClick={handleAddSession} className="flex-1 py-4 rounded-xl font-accent text-[10px] font-black uppercase tracking-widest bg-[#C8A871] text-[#0c0c0c] hover:scale-105 transition-all shadow-lg active:scale-95">
                    {editingId ? 'Update Schedule' : 'Save Schedule'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onDelete, onEdit }: { session: any, onDelete: (id: string) => void, onEdit: (s: any) => void }) {
  const gold = "#C8A871";
  
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkLive = () => {
      const now = new Date();
      const [h, m] = session.start_time.split(':');
      const start = new Date(now);
      start.setHours(parseInt(h), parseInt(m), 0);
      const end = new Date(start.getTime() + (session.duration_mins || 60) * 60 * 1000);
      setIsLive(now >= start && now < end);
    };
    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => clearInterval(interval);
  }, [session.start_time, session.duration_mins]);

  return (
    <div 
      onClick={() => onEdit(session)}
      className={`glass-card border-gold-glow flex items-center justify-between p-6 rounded-2xl group relative overflow-hidden cursor-pointer hover:bg-white/5 transition-all
        ${isLive ? 'border-[#C8A871]/60 shadow-[0_0_30px_rgba(200,168,113,0.1)]' : ''}
      `}
    >
       <div className={`absolute top-0 left-0 w-1 h-full transition-all ${isLive ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-[#C8A871] opacity-60'}`}></div>
       
       <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
             <span className="font-accent text-lg font-black tracking-tighter leading-none" style={{ color: gold }}>{session.start_time.slice(0,5)}</span>
             <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-1">START</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div>
             <div className="flex items-center gap-3 mb-1">
                <h4 className="font-accent text-sm font-black uppercase tracking-widest">{session.workout_name}</h4>
                {isLive && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-[8px] font-black text-white uppercase tracking-widest animate-pulse">LIVE NOW</span>
                )}
             </div>
             <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest font-black opacity-30">Template:</span>
                <span style={{ color: gold }}>
                   {session.program_id ? '[P]' : '[T]'} {session.workout_name}
                </span>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
              ${isLive 
                ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white' 
                : 'opacity-20 hover:opacity-100 hover:text-red-500'
              }
            `}
          >
             {isLive ? 'KILL CLASS' : <Trash2 size={16} />}
          </button>
       </div>
    </div>
  );
}
