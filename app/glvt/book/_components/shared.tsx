"use client";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { GLVT_THEME } from "../../theme";

export const DayPill = ({ date, isSelected, isToday, onClick }: { date: Date, isSelected: boolean, isToday: boolean, onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center min-w-[60px] h-[80px] rounded-full border transition-all duration-300
                ${isSelected
                    ? "bg-[#C8A871] border-[#C8A871] text-[#2D2D2D] shadow-[0_0_20px_rgba(200,168,113,0.3)] scale-105"
                    : "bg-[#3a3a3a] border-[#D7D5D2]/10 text-[#D7D5D2]/60 hover:border-[#D7D5D2]/30 hover:bg-[#444]"}
            `}
        >
            <span className="text-[10px] uppercase font-bold tracking-widest mb-1">{format(date, 'EEE')}</span>
            <span className={`text-xl font-serif ${isSelected ? "font-bold" : "font-normal"}`}>{format(date, 'd')}</span>
            {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-[#C8A871] mt-1" />}
        </button>
    );
};

export const FilterChip = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className={`
                px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.15em] font-medium border transition-all whitespace-nowrap
                ${isActive
                    ? "bg-[#2D2D2D] border-[#C8A871] text-[#C8A871] shadow-[0_0_15px_rgba(200,168,113,0.1)]"
                    : "bg-transparent border-[#D7D5D2]/10 text-[#D7D5D2]/40 hover:text-[#D7D5D2] hover:border-[#D7D5D2]/30"}
            `}
        >
            {label}
        </button>
    );
};

export const ClassCard = ({ classItem, onClick }: { classItem: any, onClick: () => void }) => {
    // This is a placeholder as the main page implements the card directly for now
    return null;
}
