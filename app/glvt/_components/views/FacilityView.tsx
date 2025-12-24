import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Calendar, Dumbbell, Clock, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { workoutSessionPipeline } from "@/lib/services/workoutSessionPipeline";
import { hrmStorage } from "@/lib/workout-engine/hrm-storage";
import { supabase } from "@/lib/supabase";
import { WorkoutsView } from "./WorkoutsView";

interface Booking {
    id: string;
    schedule: {
        id: string;
        scheduled_time: string;
        location: string;
        class: {
            name: string;
            duration_minutes: number;
            intensity: string;
        }
    };
    booking_status: string;
}

interface Enrollment {
    id: string;
    program: {
        title: string;
        difficulty: string;
    };
    status: string;
}

export function FacilityView() {
    const [activeTab, setActiveTab] = useState("schedule");
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'active' | 'summary'>('idle');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    // Active session check
    useEffect(() => {
        const checkActive = async () => {
            const currentSession = hrmStorage.getCurrentSession();
            if (currentSession && currentSession.status === 'active') {
                setSessionStatus('active');
            }
        };
        checkActive();
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch Bookings
                const { data: bookingsData, error: bookingError } = await supabase
                    .from('class_bookings')
                    .select(`
                        id, 
                        booking_status,
                        schedule:class_schedules (
                            id, scheduled_time, location,
                            class:studio_classes (name, duration_minutes, intensity)
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('booking_status', 'confirmed')
                    .gte('schedule.scheduled_time', new Date().toISOString())
                    .order('schedule(scheduled_time)', { ascending: true })
                    .limit(5);

                // Fetch Enrollments
                const { data: enrollmentData, error: enrollError } = await supabase
                    .from('program_enrollments')
                    .select(`
                        id, status,
                        program:programs (title, difficulty)
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                if (bookingsData) setBookings(bookingsData as any);
                if (enrollmentData) setEnrollments(enrollmentData as any);

            } catch (error) {
                console.error("Error fetching facility data", error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'schedule') {
            fetchData();
        }
    }, [activeTab]);


    const handleTrackClass = async (booking: Booking) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await workoutSessionPipeline.startWorkoutSession({
                userId: user.id,
                templateId: booking.schedule.id, // Linking to schedule
                // Not a hotel room ID, but a string location
                location: booking.schedule.location
            });

            hrmStorage.startSimulation();
            setSessionStatus('active');
            // Note: In a real app we'd use useToast here, but for now console is fine + state change
            console.log("Session started successfully");
        } catch (error) {
            console.error("Failed to start class tracking", error);
            alert("Failed to start session. Please try again."); // Simple fallback feedback
        }
    };

    if (sessionStatus === 'active' || sessionStatus === 'summary') {
        return <WorkoutsView />;
    }

    return (
        <div className="min-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Facility</h1>
                <div className="flex space-x-2">
                    {/* Status Indicators or filters could go here */}
                </div>
            </div>

            <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1A] border border-[#333]">
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-[#C8A871] data-[state=active]:text-black font-medium">
                        My Schedule
                    </TabsTrigger>
                    <TabsTrigger value="opengym" className="data-[state=active]:bg-[#C8A871] data-[state=active]:text-black font-medium">
                        Open Gym
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="mt-6 flex-1 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading schedule...</div>
                    ) : (
                        <>
                            {/* Bookings Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Upcoming Classes</h3>
                                {bookings.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-[#333] rounded-xl">
                                        <p className="text-gray-500 text-sm">No upcoming classes booked.</p>
                                    </div>
                                ) : (
                                    bookings.map((booking) => (
                                        <Card key={booking.id} className="bg-[#1A1A1A] border-[#333] overflow-hidden group">
                                            <CardContent className="p-0 flex">
                                                {/* Time Column */}
                                                <div className="w-20 bg-[#222] flex flex-col items-center justify-center p-3 border-r border-[#333]">
                                                    <span className="text-lg font-bold text-white">
                                                        {new Date(booking.schedule.scheduled_time).getDate()}
                                                    </span>
                                                    <span className="text-xs text-gray-400 uppercase">
                                                        {new Date(booking.schedule.scheduled_time).toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <div className="h-px w-8 bg-[#444] my-2" />
                                                    <span className="text-xs font-mono text-[#C8A871]">
                                                        {new Date(booking.schedule.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg leading-none mb-2">{booking.schedule.class.name}</h4>
                                                        <div className="flex items-center text-xs text-gray-400 space-x-3">
                                                            <div className="flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {booking.schedule.class.duration_minutes}m
                                                            </div>
                                                            <div className="flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {booking.schedule.location}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-xs bg-[#222] text-gray-300 px-2 py-1 rounded border border-[#333]">
                                                            {booking.schedule.class.intensity} Intensity
                                                        </span>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleTrackClass(booking)}
                                                            className="h-8 bg-[#34D399] hover:bg-[#10B981] text-black font-bold text-xs"
                                                        >
                                                            <Play className="w-3 h-3 mr-1 fill-current" />
                                                            START
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Programs Section */}
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">My Programs</h3>
                                {enrollments.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-[#333] rounded-xl">
                                        <p className="text-gray-500 text-sm">Not enrolled in any programs.</p>
                                    </div>
                                ) : (
                                    enrollments.map((enrollment) => (
                                        <Card key={enrollment.id} className="bg-[#1A1A1A] border-[#333]">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-white mb-1">{enrollment.program.title}</h4>
                                                    <div className="flex items-center text-xs space-x-2">
                                                        <span className="text-[#C8A871]">{enrollment.program.difficulty}</span>
                                                        <span className="text-gray-600">•</span>
                                                        <span className="text-gray-400">Week 1, Day 1</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                        </>
                    )}
                </TabsContent>

                <TabsContent value="opengym" className="mt-6">
                    <WorkoutsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
