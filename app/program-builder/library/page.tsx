"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Orbitron, Outfit } from "next/font/google";
import { ChevronLeft, Plus, Play, Calendar, Trash2, LayoutGrid, Search } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { storage, type WorkoutPlan } from "@/lib/workout-engine/storage";
import { useVenueContext } from "@/lib/venue-context";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "800"] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const numeric = parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BuilderLibraryPage() {
  const router = useRouter();
  const { activeVenue } = useVenueContext();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const brandColors = useMemo(() => {
    if (activeVenue?.colors) return activeVenue.colors;
    return { primary: "#00BFFF", secondary: "#14B8A6", accent: "#F59E0B" };
  }, [activeVenue]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Legacy Templates (direct from DB is fine if RLS is off, but let's be safe)
      let legacy: any[] = [];
      if (supabase) {
        const { data: legacyData } = await supabase
          .from("workouts")
          .select("*")
          .eq("is_template", true);
        legacy = legacyData || [];
      }

      // Fetch New Programs from our API (which uses Admin client)
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("API failed to fetch programs");
      const programs = await res.json();

      // Map programs to look like templates for the UI
      const mappedPrograms = (programs || []).map((p: any) => ({
        ...p,
        is_program: true,
        // Use the first day's data for the card preview
        data: p.program_days?.[0]?.data || { goal: 'Fat Loss', exercises: [] }
      }));

      // Combine and filter duplicates by name (if any legacy/modern overlap)
      const combined = [...mappedPrograms, ...legacy].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setTemplates(combined);
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      setError(err.message || "Failed to load templates.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (template: any) => {
    if (template.is_program) {
      router.push(`/program-builder?programId=${template.id}`);
    } else {
      const plan = template.data as WorkoutPlan;
      storage.savePlan(plan);
      router.push("/program-builder");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!supabase || !confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert("Failed to delete template: " + err.message);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.data?.goal?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={`${outfit.className} min-h-screen bg-black text-white p-6 md:p-12`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#111,transparent_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 
              className={`${orbitron.className} text-4xl md:text-5xl font-black uppercase tracking-tighter`}
              style={{ color: brandColors.primary, textShadow: `0 0 30px ${hexToRgba(brandColors.primary, 0.3)}` }}
            >
              Workout Library
            </h1>
            <p className="text-slate-400 max-w-xl">
              Manage your custom studio templates. Load them into the Builder to make edits or launch them to displays.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500/50 focus:bg-white/10 transition-all w-64"
              />
            </div>
            <Link 
              href="/program-builder"
              className="bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-sky-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Plan
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/2">
            <LayoutGrid className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No templates found</h3>
            <p className="text-slate-500 text-sm mt-2">Create your first workout in the Builder to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                className="group relative flex flex-col p-8 rounded-3xl border border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                {/* Accent line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-all"
                  style={{ backgroundColor: hexToRgba(brandColors.secondary, 0.4) }}
                />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <span 
                      className="text-[10px] uppercase font-black tracking-[0.3em]"
                      style={{ color: brandColors.secondary }}
                    >
                      {tpl.data?.goal || "Active Focus"}
                    </span>
                    <h3 className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors uppercase tracking-tight">
                      {tpl.name || "Untitled Layout"}
                    </h3>
                  </div>
                  <button 
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Stations</span>
                    <span className="text-lg font-bold text-slate-200">{tpl.data?.exercises?.length || 0} Built</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Last Modified</span>
                    <span className="text-sm font-medium text-slate-400">
                      {new Date(tpl.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
                  <button
                    onClick={() => handleLoadTemplate(tpl)}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <LayoutGrid className="w-3 h-3" /> Edit in Builder
                  </button>
                  <button
                    className="w-12 h-12 bg-sky-500 hover:bg-sky-400 rounded-xl flex items-center justify-center text-black transition-all"
                    onClick={() => {
                        if (tpl.is_program) {
                          router.push(`/program-builder?programId=${tpl.id}`);
                        } else {
                          storage.savePlan(tpl.data);
                          router.push("/program-builder");
                        }
                    }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
