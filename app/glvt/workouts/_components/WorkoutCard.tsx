"use client";

import Image from "next/image";
import { Clock, BarChart2, ChevronRight, Play } from "lucide-react";
import { glvtTheme } from "../../config/theme";

interface WorkoutCardProps {
    workout: any;
    onClick: () => void;
}

export const WorkoutCard = ({ workout, onClick }: WorkoutCardProps) => {
    return (
        <button
            onClick={onClick}
            className="w-full group relative overflow-hidden mb-4 transition-all duration-300 hover:scale-[1.01] text-left"
            style={{ borderRadius: glvtTheme.effects.borderRadius.lg }}
        >
            {/* Background & Vignette */}
            <div className={`absolute inset-0 bg-[${glvtTheme.colors.background.secondary}]`}>
                {workout.cover_image_url ? (
                    <Image
                        src={workout.cover_image_url}
                        alt={workout.title}
                        fill
                        className="object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-700 desaturate-[0.2]"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D2D2D] to-[#111]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E0E] via-[#0E0E0E]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-transparent to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative p-6 flex flex-row items-center justify-between h-32">
                <div className="flex flex-col justify-center h-full z-10 max-w-[70%]">
                    {/* Category Tag */}
                    <div className="mb-2">
                        <span
                            className="text-[9px] uppercase tracking-[0.15em] px-2 py-1 rounded-full border"
                            style={{
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: glvtTheme.colors.text.secondary,
                                backgroundColor: 'rgba(0,0,0,0.3)'
                            }}
                        >
                            {workout.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h3
                        className="text-xl mb-1 tracking-wide group-hover:text-[#D4AF37] transition-colors leading-tight line-clamp-2"
                        style={{ fontFamily: glvtTheme.fonts.title, color: '#F1EDE5' }}
                    >
                        {workout.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                        <div className="flex items-center gap-1.5" style={{ color: glvtTheme.colors.text.secondary }}>
                            <Clock className="w-3 h-3" style={{ color: glvtTheme.colors.accent.primary }} />
                            {workout.estimated_duration_min} min
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1.5" style={{ color: glvtTheme.colors.text.secondary }}>
                            <BarChart2 className="w-3 h-3" style={{ color: glvtTheme.colors.accent.primary }} />
                            {workout.difficulty_level}
                        </div>
                    </div>
                </div>

                {/* Play Button Icon */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border transition-all group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37]"
                    style={{
                        borderColor: 'rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <Play className="w-5 h-5 ml-1 text-white group-hover:text-[#0E0E0E] transition-colors" fill="currentColor" />
                </div>
            </div>

            {/* Subtle Border */}
            <div
                className="absolute inset-0 pointer-events-none transition-colors duration-500"
                style={{
                    borderRadius: glvtTheme.effects.borderRadius.lg,
                    border: `1px solid ${glvtTheme.colors.border.default}`
                }}
            />
        </button>
    );
};
