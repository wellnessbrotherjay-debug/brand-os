"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Play, LayoutGrid } from "lucide-react";
import { glvtTheme } from "../config/theme";
import { circuitService } from "@/lib/services/circuitService";
import { useRouter } from "next/navigation";

export default function CircuitLobbyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Hardcoded circuit for Stage 3 Demo
    const DEMO_CIRCUIT_ID = "GLVT-8-STATION-CORE";

    const handleCreateSession = async () => {
        setLoading(true);
        try {
            // In real app: const session = await circuitService.createSession(DEMO_CIRCUIT_ID);
            // Mocking ID for stage speed
            const mockSessionId = `session_${Math.random().toString(36).substr(2, 6)}`;

            // Redirect to controller (User is the coach/leader)
            router.push(`/glvt/circuit/${mockSessionId}/controller`);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen p-6 flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: glvtTheme.colors.background.primary, color: '#F1EDE5' }}
        >
            <div className="mb-8 p-6 rounded-full border border-[#C8A871]/20 bg-[#C8A871]/5 animate-pulse">
                <LayoutGrid className="w-12 h-12 text-[#C8A871]" />
            </div>

            <h1 className="text-3xl mb-2" style={{ fontFamily: glvtTheme.fonts.title }}>CIRCUIT MODE</h1>
            <p className="text-sm opacity-60 mb-12 max-w-xs mx-auto">
                Sync 8 stations + TV + Phone. <br />
                One timer to rule them all.
            </p>

            <button
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full max-w-sm py-4 bg-[#C8A871] text-[#0E0E0E] text-sm uppercase tracking-[0.2em] font-bold rounded-xl shadow-[0_8px_32px_rgba(200,168,113,0.3)] hover:scale-[1.02] transition-all"
            >
                {loading ? "Initializing..." : "Start New Session"}
            </button>

            <Link href="/glvt/home" className="mt-6 text-xs uppercase tracking-widest text-[#666] hover:text-white transition-colors">
                Cancel
            </Link>
        </div>
    );
}
