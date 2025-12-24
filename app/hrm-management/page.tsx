"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  storage,
  type WorkoutSetup,
  type BrandPalette,
} from "@/lib/workout-engine/storage";
import { hrmStorage } from "@/lib/workout-engine/hrm-storage";
import { HR_ZONES } from "@/lib/workout-engine/hrm-types";
import type {
  HRM,
  HRMAssignment,
  HRMMetrics,
  WorkoutSession
} from "@/lib/workout-engine/hrm-types";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { useVenueContext } from "@/lib/venue-context";

function HRMDeviceCard({
  hrm,
  onToggleStatus,
  brandColors,
}: {
  hrm: HRM;
  onToggleStatus: (id: string) => void;
  brandColors: BrandPalette;
}) {
  const { primary: primaryBrand, secondary: secondaryBrand } = brandColors;
  const statusColor = hrm.connectionStatus === 'connected' ? 'green' :
    hrm.connectionStatus === 'connecting' ? 'yellow' : 'red';

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{hrm.displayName}</h3>
          <p className="text-sm text-gray-400">{hrm.name} • Hub: {hrm.hub}</p>
        </div>
        <div
          className={`w-4 h-4 rounded-full ${statusColor === 'green' ? 'bg-green-400' :
              statusColor === 'yellow' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
            }`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400">Battery</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${(hrm.batteryLevel || 0) > 30 ? 'bg-green-400' : 'bg-red-400'
                  }`}
                style={{ width: `${hrm.batteryLevel || 0}%` }}
              />
            </div>
            <span className="text-sm text-white">{hrm.batteryLevel}%</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Status</div>
          <div
            className="text-sm font-bold"
            style={{ color: hrm.isUsed ? primaryBrand : "#34D399" }}
          >
            {hrm.isUsed ? 'In Use' : 'Available'}
          </div>
        </div>
      </div>

      <button
        onClick={() => onToggleStatus(hrm.id)}
        className="w-full py-2 px-4 rounded-lg font-bold transition-colors hover:opacity-90"
        style={{
          backgroundColor:
            hrm.connectionStatus === "connected" ? "#dc2626" : secondaryBrand,
          color: hrm.connectionStatus === "connected" ? "#fff" : "#050b12",
        }}
      >
        {hrm.connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}

function ParticipantAssignment({
  assignment,
  metric,
  onUnassign,
  brandColors,
}: {
  assignment: HRMAssignment;
  metric?: HRMMetrics;
  onUnassign: (id: string) => void;
  brandColors: BrandPalette;
}) {
  const { primary: primaryBrand, accent: accentBrand } = brandColors;
  const zone = metric ? HR_ZONES[metric.zone as keyof typeof HR_ZONES] : null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{assignment.userName}</h3>
          <p className="text-sm text-gray-400">HRM: {assignment.hrmId}</p>
        </div>
        <button
          onClick={() => onUnassign(assignment.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-bold transition-colors"
        >
          Unassign
        </button>
      </div>

      {metric ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-400">Current HR</div>
              <div className="text-xl font-bold text-red-400">{metric.currentHR}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Calories</div>
              <div className="text-xl font-bold" style={{ color: accentBrand }}>
                {metric.calories}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Rank</div>
              <div className="text-xl font-bold" style={{ color: primaryBrand }}>
                #{metric.rank}
              </div>
            </div>
          </div>

          {zone && (
            <div className="text-center">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: zone.color + '40',
                  color: zone.color,
                  border: `1px solid ${zone.color}`
                }}
              >
                ZONE {metric.zone} - {zone.name.toUpperCase()}
              </div>
            </div>
          )}

          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${metric.intensity}%`,
                backgroundColor: zone?.color || '#6B7280'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">
          No heart rate data available
        </div>
      )}
    </div>
  );
}

export default function HRMManagementPage() {
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [hrms, setHrms] = useState<HRM[]>([]);
  const [assignments, setAssignments] = useState<HRMAssignment[]>([]);
  const [metrics, setMetrics] = useState<HRMMetrics[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const { activeVenue } = useVenueContext();

  const brandColors = useMemo(
    () => resolveBrandColors({ activeVenue, setup }),
    [activeVenue, setup]
  );
  const { primary: primaryBrand, secondary: secondaryBrand, accent: accentBrand } = brandColors;

  useEffect(() => {
    setSetup(storage.getSetup());
    loadData();
  }, []);

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(loadData, 2000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const loadData = () => {
    setHrms(hrmStorage.getHRMs());
    setAssignments(hrmStorage.getHRMAssignments());
    setMetrics(hrmStorage.getHRMMetrics());
    setSession(hrmStorage.getCurrentSession());
  };

  const handleToggleHRMStatus = (hrmId: string) => {
    const hrm = hrms.find(h => h.id === hrmId);
    if (hrm) {
      const updatedHRM: HRM = {
        ...hrm,
        connectionStatus: hrm.connectionStatus === 'connected' ? 'disconnected' : 'connected'
      };
      hrmStorage.addHRM(updatedHRM);
      loadData();
    }
  };

  const handleUnassignHRM = (assignmentId: string) => {
    hrmStorage.unassignHRM(assignmentId);
    loadData();
  };

  const handleStartSimulation = () => {
    hrmStorage.generateMockData();
    const stopSimulation = hrmStorage.startSimulation();
    setIsSimulating(true);
    setIsLive(false);

    // Auto-stop after demo
    setTimeout(() => {
      stopSimulation();
      setIsSimulating(false);
    }, 300000); // 5 minutes
  };

  const handleStartLiveSession = () => {
    const stopSync = hrmStorage.startLiveSync();
    setIsLive(true);
    setIsSimulating(false);
    // Live session runs until stopped manually or page closed
  };

  const handleSyncDevices = async () => {
    await hrmStorage.fetchAvailableDevices();
    loadData();
  };

  const handleCreateNewSession = () => {
    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      location: 'Studio A',
      currentBlock: 'Warm-up',
      beginsAt: new Date().toISOString(),
      status: 'preparing',
      participants: [],
      currentPhase: 'prep',
      remaining: 300
    };

    hrmStorage.setCurrentSession(newSession);
    loadData();
  };

  const connectedHRMs = hrms.filter(h => h.connectionStatus === 'connected');
  const activeAssignments = assignments.filter(a => a.assigned);

  if (!setup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold mb-4">Loading...</div>
          <div className="text-gray-400">Please set up your workout first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          {setup.logo && (
            <Image
              src={setup.logo}
              alt="Logo"
              width={60}
              height={60}
              className="rounded-full object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryBrand }}>
              HRM Management
            </h1>
            <p className="text-gray-400">Heart Rate Monitor Control Center</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCreateNewSession}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            📋 New Session
          </button>
          <button
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className={`font-bold py-3 px-6 rounded-xl transition-colors ${isSimulating ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'hover:opacity-90'
              }`}
            style={
              isSimulating
                ? undefined
                : { backgroundColor: primaryBrand, color: '#050b12' }
            }
          >
            {isSimulating ? '🔄 Simulating...' : '🎮 Start Demo'}
          </button>

          <button
            onClick={handleStartLiveSession}
            disabled={isLive || isSimulating}
            className={`font-bold py-3 px-6 rounded-xl transition-colors ${(isLive || isSimulating) ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
          >
            {isLive ? '🔴 LIVE' : '📡 Start Live Session'}
          </button>
        </div>
      </header>

      {/* Session Status */}
      {session && (
        <div className="p-6 border-b border-gray-800">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Current Session</h2>
                <p className="text-gray-400">{session.location} • {session.currentBlock}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${session.status === 'active' ? 'bg-green-600' :
                    session.status === 'preparing' ? 'bg-yellow-600' :
                      'bg-gray-600'
                  }`}>
                  {session.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {session.remaining}s remaining
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: primaryBrand }}>
                  {activeAssignments.length}
                </div>
                <div className="text-xs text-gray-400">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{connectedHRMs.length}</div>
                <div className="text-xs text-gray-400">Connected HRMs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: accentBrand }}>
                  {metrics.reduce((sum, m) => sum + m.calories, 0)}
                </div>
                <div className="text-xs text-gray-400">Total Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.currentHR, 0) / metrics.length) : 0}
                </div>
                <div className="text-xs text-gray-400">Avg Heart Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HRM Devices */}
        <div>
          <h2 className="text-2xl font-bold mb-6" style={{ color: primaryBrand }}>
            Heart Rate Monitors
          </h2>
          <button
            onClick={handleSyncDevices}
            className="text-xs uppercase tracking-widest text-blue-400 hover:text-blue-300 mb-4"
          >
            ↻ Sync Devices from API
          </button>
          {hrms.length > 0 ? (
            <div className="space-y-4">
              {hrms.map(hrm => (
                <HRMDeviceCard
                  key={hrm.id}
                  hrm={hrm}
                  onToggleStatus={handleToggleHRMStatus}
                  brandColors={brandColors}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-4xl mb-4">💓</div>
              <div className="text-lg font-bold mb-2">No HRM Devices</div>
              <div className="text-gray-400 mb-4">Start the demo to see sample heart rate monitors</div>
              <button
                onClick={handleStartSimulation}
                className="font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: accentBrand, color: '#050b12' }}
              >
                Generate Demo Data
              </button>
            </div>
          )}
        </div>

        {/* Active Participants */}
        <div>
          <h2 className="text-2xl font-bold mb-6" style={{ color: secondaryBrand }}>
            Active Participants
          </h2>
          {activeAssignments.length > 0 ? (
            <div className="space-y-4">
              {activeAssignments.map(assignment => {
                const metric = metrics.find(m => m.userId === assignment.userId);
                return (
                  <ParticipantAssignment
                    key={assignment.id}
                    assignment={assignment}
                    metric={metric}
                    onUnassign={handleUnassignHRM}
                    brandColors={brandColors}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-4xl mb-4">👥</div>
              <div className="text-lg font-bold mb-2">No Active Participants</div>
              <div className="text-gray-400">Heart rate monitors will appear here when assigned to users</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex justify-center gap-4">
          <a
            href="/hrm-tv"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold py-3 px-6 rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: primaryBrand, color: '#050b12' }}
          >
            📺 Open HRM TV Display
          </a>
          <a
            href="/display-timer"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold py-3 px-6 rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: secondaryBrand, color: '#050b12' }}
          >
            ⏱️ Timer Display
          </a>
          <a
            href="/qr-codes"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold py-3 px-6 rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: accentBrand, color: '#050b12' }}
          >
            📱 QR Codes
          </a>
        </div>
      </div>
    </div>
  );
}
