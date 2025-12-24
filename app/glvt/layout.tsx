"use client";

import { useEffect } from "react";
import "./mobile.css";

export default function GlvtLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.body.style.backgroundColor = "#0a0a0a";
        return () => {
            document.body.style.backgroundColor = "";
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white">
            {children}
        </div>
    );
}
