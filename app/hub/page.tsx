"use client";

import Link from "next/link";
import {
    Dumbbell,
    Smartphone,
    Settings2,
    Database,
    ArrowRight,
    LayoutTemplate,
    CreditCard,
    MonitorSmartphone,
    LayoutGrid
} from "lucide-react";

export default function SolutionsHubPage() {
    return (
        <div className="min-h-screen bg-[#030712] text-white p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                            Solutions Architecture
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl">
                            Central access hub for Exequte Hotel & GLVT Fitness ecosystems.
                            Manage deployment, access front-end experiences, and configure backend services.
                        </p>
                    </div>

                    {/* Link back to Legacy Solutions if user needs it */}
                    <Link href="/solutions" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        View Legacy Dashboard
                    </Link>
                </div>

                {/* Primary Access Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 1. GLVT Gym App */}
                    <SolutionCard
                        title="GLVT Fitness"
                        description="Member-facing gym application for booking, workouts, and social features."
                        icon={<Dumbbell className="w-8 h-8 text-amber-400" />}
                        href="/glvt/home"
                        color="border-amber-500/30 hover:border-amber-500"
                        bg="bg-amber-500/5 group-hover:bg-amber-500/10"
                        tags={['Consumer App', 'Booking', 'Social']}
                    />

                    {/* 2. Hotel Mobile */}
                    <SolutionCard
                        title="Hotel Guest Mobile"
                        description="Guest services interface for room controls, dining, and amenities."
                        icon={<Smartphone className="w-8 h-8 text-cyan-400" />}
                        href="/mobile"
                        color="border-cyan-500/30 hover:border-cyan-500"
                        bg="bg-cyan-500/5 group-hover:bg-cyan-500/10"
                        tags={['Guest App', 'Room Control', 'Service']}
                    />

                    {/* 3. Global Setup */}
                    <SolutionCard
                        title="System Setup"
                        description="Configuration wizard for venue settings, displays, and branding."
                        icon={<Settings2 className="w-8 h-8 text-emerald-400" />}
                        href="/setup"
                        color="border-emerald-500/30 hover:border-emerald-500"
                        bg="bg-emerald-500/5 group-hover:bg-emerald-500/10"
                        tags={['Admin', 'Config', 'Venues']}
                    />
                </div>

                {/* Secondary / Admin Grid */}
                <div>
                    <h2 className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-6">Backend & Tools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        <ToolCard
                            name="Supabase Backend"
                            status="Connected"
                            icon={<Database className="w-4 h-4" />}
                            href="/setup/console"
                        />

                        <ToolCard
                            name="Brand Book"
                            status="Active"
                            icon={<LayoutTemplate className="w-4 h-4" />}
                            href="/brand-book"
                        />

                        <ToolCard
                            name="Digital Signage"
                            status="Display System"
                            icon={<MonitorSmartphone className="w-4 h-4" />}
                            href="/setup/displays"
                        />

                        <ToolCard
                            name="Membership & POS"
                            status="Modules"
                            icon={<CreditCard className="w-4 h-4" />}
                            href="/glvt/memberships"
                        />
                    </div>
                </div>

                {/* Environment Info */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 uppercase tracking-widest">
                    <div>Environment: Development (Local)</div>
                    <div className="mt-2 md:mt-0">Version 2.4.0 • Exequte Systems</div>
                </div>

            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function SolutionCard({ title, description, icon, href, color, bg, tags }: any) {
    return (
        <Link
            href={href}
            className={`group flex flex-col p-8 rounded-3xl border transition-all duration-300 ${color} ${bg}`}
        >
            <div className="mb-6 bg-black/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                {icon}
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 leading-relaxed mb-6 flex-1">
                {description}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                    {tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] uppercase tracking-wider text-gray-400">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                </div>
            </div>
        </Link>
    );
}

function ToolCard({ name, status, icon, href }: any) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <div>
                    <div className="text-sm font-medium text-white">{name}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{status}</div>
                </div>
            </div>
        </Link>
    );
}
