"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Edit3 } from "lucide-react";

export default function GlvtLandingPage() {
    // Hide the global app chrome (Home button, Venue switcher) for this immersive page
    useEffect(() => {
        const chrome = document.querySelector('.app-shell-chrome') as HTMLElement;
        const content = document.querySelector('.app-shell-content') as HTMLElement;
        if (chrome) chrome.style.display = 'none';
        if (content) {
            content.style.paddingTop = '0px';
            content.classList.remove('pt-20');
        }

        return () => {
            if (chrome) chrome.style.display = 'flex';
            if (content) content.style.paddingTop = '';
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col font-serif overflow-hidden">

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/glvt-launch-hero.jpg"
                    alt="GLVT Athlete"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay - Darker at bottom for readability */}
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/90 via-black/40 to-black/60"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6">
                <h1 className="text-2xl font-medium tracking-widest font-serif">GLVT</h1>
                <button className="p-2 text-white hover:text-[#C8A871] transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">

                {/* Hero Text */}
                <div className="space-y-2 mb-16 drop-shadow-lg">
                    <h2 className="text-5xl md:text-6xl leading-[0.9] tracking-wide text-[#F1EDE5]">
                        <span className="block font-medium">WHERE</span>
                        <span className="block font-medium">THE</span>
                        <span className="block font-medium">BODY</span>
                        <span className="block italic text-[#D7D5D2] font-light mt-2">IS</span>
                        <span className="block italic font-light text-[#C8A871]">HONORED</span>
                    </h2>
                </div>

                {/* CTA */}
                <div className="mt-8">
                    <Link
                        href="/glvt/launch"
                        className="text-xs uppercase tracking-[0.3em] text-white border-b border-white pb-1 hover:text-[#C8A871] hover:border-[#C8A871] transition-colors"
                    >
                        Enter The Club
                    </Link>
                </div>

            </main>

            {/* Footer / Floating Edit Icon */}
            <footer className="relative z-10 px-8 py-10 flex justify-between items-end">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#D7D5D2] font-sans opacity-80">
                    GLVT Club • EST 2024
                </div>
            </footer>
        </div>
    );
}
