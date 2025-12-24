import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Timer, Activity, Heart, Flame } from "lucide-react";
import { workoutSessionPipeline } from "@/lib/services/workoutSessionPipeline";
import { hrmStorage } from "@/lib/workout-engine/hrm-storage";
import { supabase } from "@/lib/supabase";

export function WorkoutsView() {
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'active' | 'summary'>('idle');
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [metrics, setMetrics] = useState<any>({ heartRate: 0, calories: 0, zone: 1 });
    const [summary, setSummary] = useState<any>(null);

    // Check for active session on mount
    useEffect(() => {
        const checkActive = async () => {
            const currentSession = hrmStorage.getCurrentSession();
            if (currentSession && currentSession.status === 'active') {
                setActiveSessionId(currentSession.id);
                setSessionStatus('active');

                // Calculate initial duration
                const start = new Date(currentSession.beginsAt).getTime();
                const now = new Date().getTime();
                setDuration(Math.floor((now - start) / 1000));
            }
        };
        checkActive();
    }, []);

    // Timer and Metrics Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (sessionStatus === 'active') {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);

                // Fetch latest metrics from storage
                const hrmMetrics = hrmStorage.getHRMMetrics();
                if (hrmMetrics.length > 0) {
                    // Assuming single user for now, take the first one or filter by user
                    // In real app, filter by current user ID
                    const myMetric = hrmMetrics[0];
                    if (myMetric) {
                        setMetrics({
                            heartRate: myMetric.currentHR,
                            calories: myMetric.calories,
                            zone: myMetric.zone
                        });
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sessionStatus]);

    const handleStartWorkout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to start a workout");
                return;
            }

            // Start Session
            const session = await workoutSessionPipeline.startWorkoutSession({
                userId: user.id,
                templateId: 'quick-start',
                roomId: 'gym'
            });

            // Start Simulation for Demo purposes (since we don't have real hardware connecting)
            // In a real app, this would be triggered by device connection
            hrmStorage.startSimulation();

            setActiveSessionId(session.id);
            setSessionStatus('active');
            setDuration(0);

        } catch (error) {
            console.error("Failed to start workout", error);
            alert("Failed to start workout");
        }
    };

    const handleEndWorkout = async () => {
        if (!activeSessionId) return;

        try {
            const result = await workoutSessionPipeline.endWorkoutSession(activeSessionId);
            setSummary(result);
            setSessionStatus('summary');
            setActiveSessionId(null);
        } catch (error) {
            console.error("Failed to end workout", error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (sessionStatus === 'summary' && summary) {
        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Workout Complete</h2>
                    <p className="text-gray-400">Great job!</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <Card className="bg-[#1A1A1A] border-[#333]">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <Timer className="w-8 h-8 text-[#34D399] mb-2" />
                            <span className="text-2xl font-bold text-white">{summary.durationMin}m</span>
                            <span className="text-xs text-gray-400">Duration</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1A1A1A] border-[#333]">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <Flame className="w-8 h-8 text-[#F59E0B] mb-2" />
                            <span className="text-2xl font-bold text-white">{summary.calories}</span>
                            <span className="text-xs text-gray-400">Calories</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1A1A1A] border-[#333]">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <Activity className="w-8 h-8 text-[#3B82F6] mb-2" />
                            <span className="text-2xl font-bold text-white">{summary.effortScore}/10</span>
                            <span className="text-xs text-gray-400">Effort</span>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1A1A1A] border-[#333]">
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <Heart className="w-8 h-8 text-[#EF4444] mb-2" />
                            <span className="text-2xl font-bold text-white">{summary.avgHr}</span>
                            <span className="text-xs text-gray-400">Avg HR</span>
                        </CardContent>
                    </Card>
                </div>

                <Button onClick={() => setSessionStatus('idle')} className="w-full bg-[#34D399] text-black">
                    Done
                </Button>
            </div>
        );
    }

    if (sessionStatus === 'active') {
        return (
            <div className="flex flex-col items-center justify-between h-[60vh] p-6 animate-in slide-in-from-bottom">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        <span className="text-red-500 text-xs font-bold tracking-wider">LIVE RECORDING</span>
                    </div>

                    <div className="text-7xl font-bold text-white tabular-nums tracking-tight">
                        {formatTime(duration)}
                    </div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">Duration</p>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#333] mb-3">
                            <Heart className={`w-8 h-8 ${metrics.zone >= 4 ? 'text-red-500 animate-pulse' : 'text-white'}`} />
                        </div>
                        <span className="text-3xl font-bold text-white">{metrics.heartRate}</span>
                        <span className="text-xs text-gray-500 uppercase">BPM</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#333] mb-3">
                            <Flame className="w-8 h-8 text-orange-500" />
                        </div>
                        <span className="text-3xl font-bold text-white">{metrics.calories}</span>
                        <span className="text-xs text-gray-500 uppercase">KCAL</span>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm">Zone {metrics.zone}</span>
                            <span className="text-gray-400 text-xs">Target: Zone 3</span>
                        </div>
                        <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transition-all duration-1000"
                                style={{ width: `${(metrics.heartRate / 200) * 100}%` }}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleEndWorkout}
                        size="lg"
                        variant="destructive"
                        className="w-full font-bold tracking-widest"
                    >
                        END WORKOUT
                    </Button>
                </div>
            </div>
        );
    }

    // IDLE STATE
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-6">
            <div className="relative">
                <div className="absolute inset-0 bg-[#34D399] blur-2xl opacity-20" />
                <div className="relative bg-[#1A1A1A] p-6 rounded-full border border-[#333]">
                    <Activity className="w-12 h-12 text-[#34D399]" />
                </div>
            </div>

            <div className="text-center space-y-2 max-w-xs">
                <h2 className="text-2xl font-bold text-white">Ready to Train?</h2>
                <p className="text-gray-400 text-sm">Start a workout session to track your heart rate, calories, and performance in real-time.</p>
            </div>

            <Button
                onClick={handleStartWorkout}
                size="lg"
                className="w-full max-w-xs bg-[#34D399] hover:bg-[#10B981] text-black font-bold h-14 rounded-xl text-lg shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all hover:scale-105"
            >
                <Play className="w-5 h-5 mr-2 fill-current" />
                START WORKOUT
            </Button>
        </div>
    );
}
