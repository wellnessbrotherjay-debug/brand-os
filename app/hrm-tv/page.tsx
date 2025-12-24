"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Orbitron } from "next/font/google";
import {
  storage,
  type WorkoutSetup,
  type BrandPalette,
} from "@/lib/workout-engine/storage";
import { hrmStorage } from "@/lib/workout-engine/hrm-storage";
import { HR_ZONES } from "@/lib/workout-engine/hrm-types";
import type { 
  WorkoutSession, 
  HRMMetrics 
} from "@/lib/workout-engine/hrm-types";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useVenueContext } from "@/lib/venue-context";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const numeric = parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Circular progress component with timer-style design
function CircularProgress({ 
  percentage, 
  size = 160, 
  strokeWidth = 8, 
  color = "#00BFFF" 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 20px ${hexToRgba(color, 0.6)})`
          }}
        />
      </svg>
    </div>
  );
}

// Heart rate gauge component with improved BPM display
function HeartRateGauge({ heartRate, maxHR = 200 }: { heartRate: number; maxHR?: number }) {
  const percentage = (heartRate / maxHR) * 100;
  let color = "#9CA3AF";
  
  if (percentage >= 90) color = "#EF4444";
  else if (percentage >= 80) color = "#F59E0B";
  else if (percentage >= 70) color = "#10B981";
  else if (percentage >= 60) color = "#3B82F6";

  return (
    <div className="relative flex items-center justify-center">
      <CircularProgress percentage={percentage} color={color} size={160} strokeWidth={12} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div 
          className="text-6xl font-black leading-none tracking-[0.08em]"
          style={{ 
            color: color, 
            textShadow: `0 0 35px ${hexToRgba(color, 0.4)}`,
            fontFamily: 'var(--font-orbitron)'
          }}
        >
          {heartRate}
        </div>
        <div 
          className="text-xs uppercase tracking-[0.25em] font-semibold mt-1"
          style={{ color: hexToRgba(color, 0.7) }}
        >
          BPM
        </div>
      </div>
    </div>
  );
}
// Participant card component with timer-style design
function ParticipantCard({
  metric,
  isLeader = false,
  brandColors,
}: {
  metric: HRMMetrics;
  isLeader?: boolean;
  brandColors: BrandPalette;
}) {
  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;
  const zone = HR_ZONES[metric.zone as keyof typeof HR_ZONES];
  const percentage = (metric.currentHR / 200) * 100;

  return (
    <div 
      className={`rounded-[24px] border border-white/10 bg-black/60 p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-500 ${
        isLeader 
          ? 'ring-2 ring-yellow-400/50 bg-gradient-to-br from-yellow-900/20 to-black/60' 
          : ''
      }`}
      style={{
        backgroundColor: isLeader
          ? hexToRgba(secondaryBrand, 0.08)
          : hexToRgba(zone.color, 0.05),
      }}
    >
      {/* Rank Badge */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${
            isLeader 
              ? 'bg-yellow-400 text-black' 
              : 'bg-white/10 text-white border border-white/20'
          }`}
          style={{
            backgroundColor: isLeader ? secondaryBrand : hexToRgba(zone.color, 0.2),
            border: isLeader ? "none" : `1px solid ${hexToRgba(zone.color, 0.3)}`,
          }}
        >
          {metric.rank}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.25em]" style={{ color: hexToRgba(primaryBrand, 0.7) }}>
            CALORIES
          </div>
          <div className="text-2xl font-bold" style={{ color: accentBrand }}>
            {metric.calories}
          </div>
        </div>
      </div>

      {/* User Name */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-orbitron)' }}>
          {metric.userName}
        </h3>
        <div className="text-xs uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
          HRM {metric.hrmId.slice(-3)}
        </div>
      </div>

      {/* Heart Rate Gauge */}
      <div className="flex items-center justify-center mb-6">
        <HeartRateGauge heartRate={metric.currentHR} />
      </div>

      {/* HR Zone */}
      <div className="text-center mb-6">
        <div 
          className="inline-block px-4 py-2 rounded-full text-xs uppercase font-bold tracking-[0.15em] border"
          style={{ 
            backgroundColor: hexToRgba(zone.color, 0.15), 
            color: zone.color,
            border: `1px solid ${hexToRgba(zone.color, 0.3)}`
          }}
        >
          ZONE {metric.zone} - {zone.name.toUpperCase()}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-3">
          <div className="text-xs uppercase tracking-[0.25em]" style={{ color: hexToRgba(primaryBrand, 0.7) }}>
            AVG HR
          </div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {metric.averageHR}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-3">
          <div className="text-xs uppercase tracking-[0.25em]" style={{ color: hexToRgba(primaryBrand, 0.7) }}>
            MAX HR
          </div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {metric.maxHR}
          </div>
        </div>
      </div>

      {/* Intensity Bar */}
      <div>
        <div
          className="flex justify-between text-xs uppercase tracking-[0.25em] mb-2"
          style={{ color: hexToRgba(primaryBrand, 0.7) }}
        >
          <span>Intensity</span>
          <span>{metric.intensity}%</span>
        </div>
        <div className="w-full bg-black/50 rounded-full h-3 border border-white/10">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${metric.intensity}%`,
              backgroundColor: zone.color,
              filter: `drop-shadow(0 0 8px ${hexToRgba(zone.color, 0.5)})`
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function HRMTVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading HRM System...</div>
        </div>
      </div>
    }>
      <HRMTVContent />
    </Suspense>
  );
}

function HRMTVContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || 'Studio A';
  
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [metrics, setMetrics] = useState<HRMMetrics[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { activeVenue } = useVenueContext();

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );
  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  useEffect(() => {
    // Load initial data
    setSetup(storage.getSetup());
    
    // Initialize HRM data if not exists
    const existingMetrics = hrmStorage.getHRMMetrics();
    if (existingMetrics.length === 0) {
      hrmStorage.generateMockData();
    }
    
    // Start simulation
    const stopSimulation = hrmStorage.startSimulation();
    
    return stopSimulation;
  }, []);

  useEffect(() => {
    // Update session and metrics every second
    const interval = setInterval(() => {
      setSession(hrmStorage.getCurrentSession());
      setMetrics(hrmStorage.getHRMMetrics());
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!setup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading HRM System...</div>
        </div>
      </div>
    );
  }

  const activeMetrics = metrics.filter(m => m.isActive);
  const leader = activeMetrics.length > 0 ? activeMetrics[0] : null;
  const averageHR = activeMetrics.length > 0 
    ? Math.round(activeMetrics.reduce((sum, m) => sum + m.currentHR, 0) / activeMetrics.length)
    : 0;
  const totalCalories = activeMetrics.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div 
      className={`${orbitron.variable} ${orbitron.className} relative flex min-h-screen w-screen flex-col bg-black text-white`}
    >
      {/* Background gradient matching timer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202020,transparent_55%)]" />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-8 border-b border-white/10">
        <div className="flex items-center gap-6">
          {setup.logo && (
            <Image
              src={setup.logo}
              alt="Logo"
              width={80}
              height={80}
              className="rounded-full object-contain"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold" style={{ color: primaryBrand }}>
              {setup.facilityName || "Fitness Center"}
            </h1>
            <p className="text-lg tracking-[0.15em] uppercase" style={{ color: hexToRgba('#6B7280', 0.8) }}>
              Heart Rate Monitoring • {location}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg tracking-[0.15em] uppercase" style={{ color: hexToRgba('#6B7280', 0.8) }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {session?.currentBlock || "Ready"}
          </div>
          {session && (
            <div className="text-lg font-bold" style={{ color: primaryBrand }}>
              {session.remaining}s remaining
            </div>
          )}
        </div>
      </header>

      {/* Stats Summary */}
      <div className="relative z-10 grid grid-cols-4 gap-8 p-8 border-b border-white/10">
        <div className="rounded-[24px] border border-white/10 bg-black/60 p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="text-5xl font-black" style={{ color: primaryBrand, fontFamily: 'var(--font-orbitron)' }}>
            {activeMetrics.length}
          </div>
          <div className="text-sm uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
            Active Participants
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-black/60 p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="text-5xl font-black" style={{ color: '#10B981', fontFamily: 'var(--font-orbitron)' }}>
            {averageHR}
          </div>
          <div className="text-sm uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
            Average Heart Rate
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-black/60 p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="text-5xl font-black" style={{ color: accentBrand, fontFamily: 'var(--font-orbitron)' }}>
            {totalCalories}
          </div>
          <div className="text-sm uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
            Total Calories
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-black/60 p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="text-5xl font-black" style={{ color: secondaryBrand, fontFamily: 'var(--font-orbitron)' }}>
            {leader ? `${leader.userName.split(' ')[0]}` : "N/A"}
          </div>
          <div className="text-sm uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
            Current Leader
          </div>
        </div>
      </div>

      {/* Participant Grid */}
      <div className="relative z-10 flex-1 p-8">
        {activeMetrics.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 h-full">
            {activeMetrics.map((metric, index) => (
              <ParticipantCard
                key={metric.userId}
                metric={metric}
                isLeader={index === 0}
                brandColors={brandColors}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center rounded-[24px] border border-white/10 bg-black/60 p-12 shadow-[0_0_45px_rgba(0,0,0,0.4)] backdrop-blur-md">
              <div className="text-8xl mb-6">💓</div>
              <div className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                No Active Participants
              </div>
              <div className="text-lg tracking-[0.15em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
                Waiting for heart rate monitors to connect...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-white/10 text-center">
        <div className="text-sm uppercase tracking-[0.25em]" style={{ color: hexToRgba('#6B7280', 0.8) }}>
          Real-time heart rate monitoring • Updates every 2 seconds
        </div>
      </footer>
    </div>
  );
}
