"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, MapPin, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GLVT_THEME, commonStyles } from "../../theme";
import { format } from "date-fns";
import Image from "next/image";

// Class data mapping - matches the booking page
const CLASS_DATA: any = {
    "glute-activation": {
        name: "Glute Activation",
        coach: "Coach Mike Chen",
        image: "/class-covers/glutes-workout.png",
        location: "Studio A",
    },
    "core-foundation": {
        name: "Core Foundation",
        coach: "Sarah Liu",
        image: "/class-covers/core-strength.png",
        location: "Studio B",
    },
    "pilates-core": {
        name: "Pilates Core",
        coach: "Sarah Liu",
        image: "/class-covers/pilates-core.png",
        location: "Studio A",
    },
    "glute-sculpt": {
        name: "Glute Sculpt",
        coach: "Emma Park",
        image: "/class-covers/glute-sculpt.png",
        location: "Studio A",
    },
    "abs-blast": {
        name: "Abs Blast",
        coach: "Coach Danny Kim",
        image: "/class-covers/abs-blast.png",
        location: "Studio B",
    },
    "lower-body-power": {
        name: "Lower Body Power",
        coach: "Jessica Tan",
        image: "/class-covers/lower-body-power.png",
        location: "Studio A",
    }
};

export default function BookingConfirmPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const classId = searchParams.get('class');
    const timeStr = searchParams.get('time');
    const [confirmed, setConfirmed] = useState(false);

    // Get the actual class data based on classId
    const classData = classId && CLASS_DATA[classId] ? CLASS_DATA[classId] : {
        name: "Class",
        coach: "Instructor",
        image: "/class-covers/glutes-workout.png",
        location: "Studio A",
    };

    // Parse time
    const date = timeStr ? new Date(timeStr) : new Date();

    const handleConfirm = () => {
        setConfirmed(true);
        // Persistence Logic for Home Page
        // 1. Reset the cancellation flag so the "Up Next" card shows again
        localStorage.removeItem("glvt_booking_cancelled");

        // 2. Store the actual booking details so home page can display them
        localStorage.setItem("glvt_active_booking", JSON.stringify({
            classId,
            className: classData.name,
            coach: classData.coach,
            time: timeStr,
            image: classData.image,
            location: classData.location
        }));

        // Simulate API
        setTimeout(() => {
            // In a real app, maybe navigate to a "Ticket" view, but here we show success state in-place
        }, 1500);
    };

    if (confirmed) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${commonStyles.pageContainer}`}>
                <div className="w-20 h-20 rounded-full bg-[#C8A871] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(200,168,113,0.4)] animate-in zoom-in duration-500">
                    <Check className="w-10 h-10 text-[#2D2D2D]" />
                </div>
                <h1 className="text-4xl text-[#F1EDE5] mb-4" style={{ fontFamily: 'serif' }}>Confirmed</h1>
                <p className="text-[#D7D5D2]/60 text-sm max-w-xs mx-auto leading-relaxed mb-12">
                    You are booked for <strong>{classData.name}</strong>. A calendar invite has been sent to your email.
                </p>
                <Link href="/glvt/home" className={commonStyles.buttonOutline}>
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col ${commonStyles.pageContainer}`}>
            {/* Header */}
            <header className="px-6 py-6 border-b border-[#D7D5D2]/5 sticky top-0 bg-[#2D2D2D]/95 backdrop-blur z-10">
                <button onClick={() => router.back()} className="flex items-center text-[#D7D5D2]/60 hover:text-[#C8A871] transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Cancel</span>
                </button>
            </header>

            <main className="flex-1 px-6 py-8 flex flex-col justify-between max-w-md mx-auto w-full">

                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#C8A871] font-bold">Confirm Booking</div>
                        <h1 className="text-4xl text-[#F1EDE5] leading-tight" style={{ fontFamily: 'serif' }}>
                            {classData.name}
                        </h1>
                    </div>

                    {/* Ticket / Receipt Card */}
                    <div className="bg-[#F1EDE5] text-[#2D2D2D] rounded-xl p-8 shadow-2xl relative overflow-hidden">
                        {/* Cutout notch effect visual */}
                        <div className="absolute top-1/2 left-0 w-4 h-8 bg-[#2D2D2D] rounded-r-full -translate-y-1/2"></div>
                        <div className="absolute top-1/2 right-0 w-4 h-8 bg-[#2D2D2D] rounded-l-full -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-[#2D2D2D]/10"></div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4 pb-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2D2D2D]">
                                    {/* Placeholder for coach image */}
                                    <div className="w-full h-full bg-[#333]"></div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-[#2D2D2D]/60 font-medium">Instructor</div>
                                    <div className="font-serif text-lg">{classData.coach}</div>
                                </div>
                            </div>

                            <div className="pt-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-5 h-5 text-[#C8A871]" />
                                    <div className="text-sm font-medium">{format(date, 'EEEE, MMMM do')}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Clock className="w-5 h-5 text-[#C8A871]" />
                                    <div className="text-sm font-medium">{format(date, 'h:mm a')}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-5 h-5 text-[#C8A871]" />
                                    <div className="text-sm font-medium">{classData.location}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-8">
                    <div className="flex justify-between items-center px-2 text-xs text-[#D7D5D2]/60 uppercase tracking-wider">
                        <span>Payment Method</span>
                        <span className="text-[#F1EDE5]">Membership Credit</span>
                    </div>
                    <div className="flex justify-between items-center px-2 text-xs text-[#D7D5D2]/60 uppercase tracking-wider mb-4">
                        <span>Balance After</span>
                        <span className="text-[#F1EDE5]">2 Credits</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="w-full bg-[#C8A871] hover:bg-[#d4b57a] text-[#2D2D2D] font-bold text-sm uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_0_30px_rgba(200,168,113,0.3)] transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                    >
                        Confirm Booking <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-center text-[10px] text-[#D7D5D2]/30 max-w-xs mx-auto">
                        Cancellation is free up to 12 hours before the session start time.
                    </p>
                </div>

            </main>
        </div>
    );
}
