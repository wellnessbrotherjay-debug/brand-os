"use client";

import LegacySolutions from "../page.legacy";
import Link from "next/link";
import { ArrowRight, Smartphone, Dumbbell, LayoutDashboard } from "lucide-react";

export default function SolutionsPage() {
  return (
    <div className="relative">
      {/* 
        NEW QUICK ACCESS HEADER 
        Injected above legacy content to satisfy user request 
      */}
      <div className="bg-[#0f172a] text-white p-6 pb-0 border-b border-gray-800">
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#00BFFF] mb-6">Quick Launch Access</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/glvt" className="group relative p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#00BFFF] transition-all overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#00BFFF]/20 rounded-lg text-[#00BFFF]">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm uppercase tracking-wider">GLVT Gym App</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Member experience & booking</p>
              <div className="flex items-center text-[10px] text-[#00BFFF] uppercase tracking-[0.2em] group-hover:gap-2 transition-all">
                Launch <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>

            <Link href="/mobile" className="group relative p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#F59E0B] transition-all overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#F59E0B]/20 rounded-lg text-[#F59E0B]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm uppercase tracking-wider">Hotel Mobile</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Guest services & room control</p>
              <div className="flex items-center text-[10px] text-[#F59E0B] uppercase tracking-[0.2em] group-hover:gap-2 transition-all">
                Launch <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>

            <Link href="/hub" className="group relative p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-400 transition-all overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-400/20 rounded-lg text-emerald-400">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm uppercase tracking-wider">Solutions Hub</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">New Architecture Dashboard</p>
              <div className="flex items-center text-[10px] text-emerald-400 uppercase tracking-[0.2em] group-hover:gap-2 transition-all">
                Open Hub <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Render Legacy Layout Below */}
      <LegacySolutions />
    </div>
  );
}
