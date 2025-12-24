"use client";

import { useState } from "react";
import { ChevronLeft, Clock, Users, MapPin, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { commonStyles } from "../../theme";

// MOCK DATA - In a real app, this would fetch based on an ID or valid session context
const BOOKED_CLASS = {
    id: "pilates-core",
    name: "Pilates Core",
    coachName: "Coach Sarah",
    coachImage: "/coaches/sarah-liu.png",
    time: new Date().setHours(17, 0, 0, 0), // Today 5pm
    duration: "60 min",
    intensity: "Medium",
    spot: "A4", // Assigned spot
    location: "Studio 1",
    description: "Classical pilates movements targeting deep core muscles. Improve posture, stability, and body awareness.",
    coverImage: "/class-covers/pilates-core.png",
    focus: "Core"
};

export default function ManageBookingPage() {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Initial render time for hydration consistency
    const [classTime] = useState(new Date(BOOKED_CLASS.time));

    const handleCancel = () => {
        // Here we would call the API to cancel the booking
        // For now, simulate by saving to local storage
        localStorage.setItem("glvt_booking_cancelled", "true");
        // Redirect to Home
        window.location.href = "/glvt/home";
    };

    return (
        <div className={`min-h-screen bg-[#2D2D2D] text-[#F1EDE5] relative overflow-hidden flex flex-col ${commonStyles.pageContainer}`}>
            {/* Full-Page Hero Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={BOOKED_CLASS.coverImage}
                    alt={BOOKED_CLASS.name}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Strong Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black to-black"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col h-full overflow-y-auto">
                {/* Header Action */}
                <div className="px-6 py-6 sticky top-0 z-20 flex justify-between items-center">
                    <Link
                        href="/glvt/home"
                        className="flex items-center text-[#F1EDE5]/80 hover:text-[#C8A871] transition-colors gap-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold shadow-black drop-shadow-md">Back</span>
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-[35vh]">
                    {/* Badge */}
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-[#10b981] text-white text-[10px] uppercase tracking-widest rounded-sm font-bold shadow-lg">
                            Confirmed
                        </span>
                    </div>

                    {/* Class Name */}
                    <h1 className="text-5xl md:text-6xl text-white mb-6 leading-[0.9] font-serif tracking-tight drop-shadow-lg">
                        {BOOKED_CLASS.name}
                    </h1>

                    {/* Stats Strip */}
                    <div className="flex items-center gap-6 mb-8 border-y border-white/10 py-4 backdrop-blur-sm bg-black/10">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#C8A871]" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Start</span>
                                <span className="text-sm font-bold text-[#F1EDE5]">{format(classTime, 'h:mm a')}</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#C8A871]" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Location</span>
                                <span className="text-sm font-bold text-[#F1EDE5]">{BOOKED_CLASS.location}</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#C8A871]" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase text-[#D7D5D2]/60 tracking-wider">Coach</span>
                                <span className="text-sm font-bold text-[#F1EDE5]">{BOOKED_CLASS.coachName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <p className="text-[#D7D5D2]/90 leading-relaxed text-sm max-w-lg font-light">
                            {BOOKED_CLASS.description}
                        </p>
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-center text-sm uppercase tracking-[0.2em] font-bold py-5 rounded-xl border border-red-500/20 transition-all"
                    >
                        Cancel Booking
                    </button>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                    <div className="bg-[#2D2D2D] border border-[#D7D5D2]/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-serif text-[#F1EDE5] mb-2">Cancel Class?</h3>
                        <p className="text-sm text-[#D7D5D2]/60 mb-6 leading-relaxed">
                            Are you sure you want to cancel your spot in <strong>{BOOKED_CLASS.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-[#D7D5D2]/10 text-[#D7D5D2] text-xs uppercase tracking-wider font-bold hover:bg-white/5"
                            >
                                Keep Spot
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-wider font-bold shadow-lg"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
