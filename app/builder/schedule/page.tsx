"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Orbitron, Outfit } from "next/font/google";
import { ChevronLeft, Calendar, Clock, LayoutGrid, CheckCircle2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
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

export default function ScheduleManagerPage() {
  const { activeVenue } = useVenueContext();
  const [scheduledWorkouts, setScheduledWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brandColors = useMemo(() => {
    if (activeVenue?.colors) return activeVenue.colors;
    return { primary: "#00BFFF", secondary: "#14B8A6", accent: "#F59E0B" };
  }, [activeVenue]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    if (!supabase) {
      setError("Database connection not configured.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true });

      if (fetchError) throw fetchError;
      setScheduledWorkouts(data || []);
    } catch (err: any) {
      console.error("Failed to fetch schedule:", err);
      setError(err.message || "Failed to load schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`${outfit.className} min-h-screen bg-black text-white p-6 md:p-12`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#111,transparent_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 
            className={`${orbitron.className} text-4xl md:text-5xl font-black uppercase tracking-tighter`}
            style={{ color: brandColors.primary, textShadow: `0 0 30px ${hexToRgba(brandColors.primary, 0.3)}` }}
          >
            Schedule Manager
          </h1>
          <p className="text-slate-400 max-w-xl mt-4">
            Track and manage workouts scheduled for specific studio dates.
          </p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : scheduledWorkouts.length === 0 ? (
          <div className="text-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/2">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No scheduled sessions</h3>
            <p className="text-slate-500 text-sm mt-2">Use the Builder to schedule a workout for a specific date.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledWorkouts.map((tpl) => (
              <div 
                key={tpl.id}
                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-4 md:mb-0">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: hexToRgba(brandColors.secondary, 0.1) }}
                  >
                    <Calendar className="w-6 h-6" style={{ color: brandColors.secondary }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                        {tpl.name || "Scheduled Session"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        Confirmed
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        {new Date(tpl.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        Multiple Occurrences
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link
                    href="/builder"
                    onClick={() => storage.savePlan(tpl.data)}
                    className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-center"
                  >
                    View Layout
                  </Link>
                  <button className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all text-center">
                    Launch Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-20 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">
            Real-time Studio Scheduling System • Exequte Operations
          </p>
        </footer>
      </div>
    </main>
  );
}
