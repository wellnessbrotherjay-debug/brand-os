"use client";

import { ChevronLeft, CreditCard, CheckCircle, Crown, Star } from "lucide-react";
import Link from "next/link";
import { GLVT_THEME, commonStyles } from "../theme";

const MOCK_MEMBERSHIP = {
    plan: "Titanium Monthly",
    status: "Active",
    renews: "Jan 17, 2026",
    price: "¥1200 / mo",
    features: ["Unlimited Classes", "24/7 Gym Access", "Private Locker", "Laundry Service"]
};

export default function MembershipsPage() {
    return (
        <div className={`min-h-screen flex flex-col ${commonStyles.pageContainer}`} style={{ fontFamily: GLVT_THEME.fonts.sans }}>
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#D7D5D2]/5 sticky top-0 bg-[#2D2D2D]/95 backdrop-blur z-20 flex justify-between items-center">
                <Link href="/glvt/home" className="flex items-center text-[#F1EDE5] hover:text-[#C8A871] transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-4" />
                    <div>
                        <h1 className="text-2xl font-serif leading-none">Membership</h1>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#D7D5D2]/50">Manage Account</span>
                    </div>
                </Link>
            </header>

            <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">

                {/* Luxury Card */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#D7D5D2]/20 p-8 aspect-[1.58/1] flex flex-col justify-between shadow-2xl mb-8 group hover:scale-[1.01] transition-transform">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A871]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fff]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-[#C8A871]" />
                            <span className="text-xl font-serif italic tracking-widest text-[#F1EDE5]">GLVT</span>
                        </div>
                        <span className="bg-[#F1EDE5] text-[#2D2D2D] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                            {MOCK_MEMBERSHIP.status}
                        </span>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-end gap-2 mb-1">
                            <Star className="w-4 h-4 text-[#C8A871] fill-[#C8A871]" />
                            <Star className="w-4 h-4 text-[#C8A871] fill-[#C8A871]" />
                            <Star className="w-4 h-4 text-[#C8A871] fill-[#C8A871]" />
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/60 mb-2">Current Tier</div>
                        <div className="text-2xl text-[#F1EDE5] font-serif mb-0.5">{MOCK_MEMBERSHIP.plan}</div>
                        <div className="text-[10px] text-[#C8A871] font-mono">Renews {MOCK_MEMBERSHIP.renews}</div>
                    </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#D7D5D2]/40 mb-4 font-bold">Privileges</h3>
                        <div className="space-y-4">
                            {MOCK_MEMBERSHIP.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-6 h-6 rounded-full bg-[#3a3a3a] border border-[#D7D5D2]/10 flex items-center justify-center group-hover:border-[#C8A871] transition-colors">
                                        <CheckCircle className="w-3 h-3 text-[#C8A871]" />
                                    </div>
                                    <span className="text-sm text-[#D7D5D2]/80 group-hover:text-[#F1EDE5] transition-colors">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#D7D5D2]/5">
                        <button className={commonStyles.buttonOutline}>
                            Manage Subscription
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
