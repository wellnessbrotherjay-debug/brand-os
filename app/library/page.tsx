'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '@/components/MainLayout';
import { Exercise } from '@/lib/types/hotel-fitness';

export default function LibraryPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        async function fetchData() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('name');

            if (!error && data) {
                setExercises(data);
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    // Calculate statistics
    const stats = {
        total: exercises.length,
        cloud: exercises.filter(ex => ex.demo_url && (ex.demo_url.includes('cloudflarestream.com') || ex.demo_url.length === 32)).length,
        local: exercises.filter(ex => ex.demo_url?.startsWith('/')).length,
        missing: exercises.filter(ex => !ex.demo_url).length,
    };

    const getVideoStatus = (url?: string) => {
        if (!url) return { label: 'Missing', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        if (url.includes('cloudflarestream.com') || (url.length === 32 && !url.includes('/'))) {
            return { label: 'Cloud', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        }
        if (url.startsWith('/')) {
            return { label: 'Local', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        }
        return { label: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    };

    return (
        <MainLayout title="Library Audit" subtitle="Exercise & Asset Status">
            <div className="mx-auto max-w-7xl px-6 py-10 text-white">

                {/* Stats Header */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Exercises</div>
                        <div className="text-3xl font-bold mt-1">{stats.total}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">Cloud Ready</div>
                        <div className="text-3xl font-bold mt-1 text-emerald-300">{stats.cloud}</div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-amber-400">Local / Legacy</div>
                        <div className="text-3xl font-bold mt-1 text-amber-300">{stats.local}</div>
                    </div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-red-400">Missing Video</div>
                        <div className="text-3xl font-bold mt-1 text-red-300">{stats.missing}</div>
                    </div>
                </div>

                {/* List */}
                <div className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-white/5 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Exercise Name</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Video Source</th>
                                    <th className="px-6 py-4 font-medium">Video Preview / URL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            Loading exercises...
                                        </td>
                                    </tr>
                                ) : exercises.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No exercises found in library.
                                        </td>
                                    </tr>
                                ) : (
                                    exercises.map((ex) => {
                                        const status = getVideoStatus(ex.demo_url);
                                        return (
                                            <tr key={ex.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white">{ex.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-1">{ex.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300 capitalize">
                                                        {ex.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color} ${status.bg} ${status.border}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate text-xs text-slate-500 font-mono" title={ex.demo_url || ''}>
                                                        {ex.demo_url || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
