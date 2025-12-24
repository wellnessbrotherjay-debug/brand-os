"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function GLVTLaunchPage() {
    // RESET FOR TESTING: Clear profile when landing here so "Enter" always goes to Onboarding
    useEffect(() => {
        localStorage.removeItem("glvt_user_profile");
    }, []);

    return (
        <div className="h-screen bg-[#2D2D2D] relative overflow-hidden">
            {/* Full-Page Hero Image */}
            <div className="absolute inset-0">
                <Image
                    src="/glvt-launch-hero.jpg"
                    alt="GLVT"
                    fill
                    className="object-contain"
                    priority
                />
                {/* Strong Dark Gradient Overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 h-screen flex flex-col justify-between py-6 px-6">
                {/* Logo at Top */}
                <div className="flex justify-center">
                    <div className="text-center bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
                        <h1 className="text-4xl text-[#C8A871] mb-1 tracking-[0.3em]" style={{ fontFamily: 'serif' }}>
                            GLVT
                        </h1>
                        <div className="h-px w-24 bg-[#C8A871]/30 mx-auto"></div>
                        <p className="text-[#F1EDE5]/70 text-[10px] uppercase tracking-[0.25em] mt-2 font-light">
                            Glutes & Core
                        </p>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Enter Button at Bottom */}
                <div className="pb-4">
                    <Link
                        href="/glvt/login"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-[#C8A871] hover:bg-[#d4b57a] text-[#2D2D2D] text-center text-sm uppercase tracking-[0.2em] font-bold transition-all rounded-2xl shadow-[0_8px_32px_rgba(200,168,113,0.4)] hover:shadow-[0_12px_40px_rgba(200,168,113,0.6)] group"
                    >
                        <span>Enter the Club</span>
                        <div className="w-9 h-9 rounded-full bg-[#2D2D2D] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ChevronRight className="w-5 h-5 text-[#C8A871]" />
                        </div>
                    </Link>

                    {/* Tagline */}
                    <div className="flex flex-col items-center gap-4 mt-6">
                        <p className="text-center text-[#F1EDE5]/50 text-[10px] tracking-wider">
                            Elevate Your Training
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
