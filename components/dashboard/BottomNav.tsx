
import { Home, User, Calendar, Building2 } from "lucide-react";

interface BottomNavProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

export function BottomNav({ activeView, onNavigate }: BottomNavProps) {
    const navItems = [
        { id: 'dashboard', icon: Home, label: 'HOME' },
        { id: 'log', icon: Calendar, label: 'DIARY' },
        { id: 'workouts', icon: Building2, label: 'FACILITY' },
        { id: 'profile', icon: User, label: 'PROFILE' }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#222] px-6 py-4 z-50 pb-8">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = activeView === item.id || (item.id === 'log' && activeView === 'recipes'); // mapping recipes to diary
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="flex flex-col items-center gap-2 w-16"
                        >
                            <div className={`p-3 rounded-full transition-all duration-300 ${isActive
                                ? "bg-[#C8A871] text-black"
                                : "bg-transparent text-[#666] hover:text-[#999]"
                                }`}>
                                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-widest ${isActive ? "text-[#C8A871]" : "text-[#444]"
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Add padding to bottom of page content to account for this fixed bar
export const BottomNavSpacer = () => <div className="h-24 w-full" />;
