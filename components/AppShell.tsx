"use client";

import { usePathname } from "next/navigation";

export default function AppShell() {
    const pathname = usePathname();
    
    // Hide AppShell completely for GLVT routes
    if (pathname?.startsWith('/glvt')) {
        return null;
    }

    return null; // Simplified - hide for all routes for now
}
