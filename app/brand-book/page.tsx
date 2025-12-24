"use client";

import dynamic from 'next/dynamic';

// Dynamically import the SPA to avoid SSR issues with client-side logic
const BrandApp = dynamic(() => import('./_components/BrandApp'), {
    ssr: false,
    loading: () => <div className="flex h-screen items-center justify-center bg-black text-white">Loading Brand OS...</div>
});

export default function BrandBookPage() {
    return <BrandApp />;
}
