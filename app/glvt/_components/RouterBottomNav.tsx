"use client";

import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components/dashboard/BottomNav";

export function RouterBottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    // Map current path to active view ID
    const getActiveView = () => {
        if (pathname?.includes('/glvt/diary')) return 'log';
        if (pathname?.includes('/glvt/book') || pathname?.includes('/glvt/facility') || pathname?.includes('/glvt/training')) return 'workouts'; // Facility & Workouts map to same tab
        if (pathname?.includes('/glvt/profile')) return 'profile';
        if (pathname?.includes('/glvt/home')) return 'dashboard';

        // Fallback for sub-routes
        return '';
    };

    // Handle navigation
    const handleNavigate = (viewId: string) => {
        switch (viewId) {
            case 'dashboard':
                router.push('/glvt/home');
                break;
            case 'log':
                router.push('/glvt/diary');
                break;
            case 'workouts':
                // The browser agent said booking is at /glvt/book, but FacilityView is new.
                // Let's assume /glvt/book is where the FacilityView is mounted or redirected.
                router.push('/glvt/book');
                break;
            case 'profile':
                router.push('/glvt/profile');
                break;
            default:
                break;
        }
    };

    // Hide on login/onboarding if needed, but for now show if we are deep in app
    // if (pathname === '/glvt/login') return null;

    return <BottomNav activeView={getActiveView()} onNavigate={handleNavigate} />;
}
