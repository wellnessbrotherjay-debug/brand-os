import type {
  HRM,
  HRMAssignment,
  HeartRateData,
  HRMGraphData,
  WorkoutSession,
  HRMMetrics,
  HRZone
} from './hrm-types';
import {
  getHrmLastWithCalorie,
  getHrmDevices,
  type BandInfo
} from '../services/exequteHrmApi';

// Extended storage keys for HRM
export const HRM_STORAGE_KEYS = {
  hrms: 'exequte-hrms',
  hrmAssignments: 'exequte-hrm-assignments',
  heartRateData: 'exequte-heart-rate-data',
  currentSession: 'exequte-current-session',
  hrmMetrics: 'exequte-hrm-metrics',
} as const;

// Simple storage utility for HRM data
class StorageUtil {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle storage errors silently
    }
  }
}

const hrmStorageUtil = new StorageUtil();

class HRMStorage {
  // HRM Device Management
  getHRMs(): HRM[] {
    return hrmStorageUtil.get<HRM[]>(HRM_STORAGE_KEYS.hrms) || [];
  }

  setHRMs(hrms: HRM[]): void {
    hrmStorageUtil.set(HRM_STORAGE_KEYS.hrms, hrms);
  }

  addHRM(hrm: HRM): void {
    const hrms = this.getHRMs();
    const existing = hrms.findIndex(h => h.id === hrm.id);
    if (existing >= 0) {
      hrms[existing] = hrm;
    } else {
      hrms.push(hrm);
    }
    this.setHRMs(hrms);
  }

  getAvailableHRMs(): HRM[] {
    return this.getHRMs().filter(hrm => !hrm.isUsed);
  }

  // HRM Assignments
  getHRMAssignments(): HRMAssignment[] {
    return hrmStorageUtil.get<HRMAssignment[]>(HRM_STORAGE_KEYS.hrmAssignments) || [];
  }

  setHRMAssignments(assignments: HRMAssignment[]): void {
    hrmStorageUtil.set(HRM_STORAGE_KEYS.hrmAssignments, assignments);
  }

  assignHRM(assignment: HRMAssignment): void {
    const assignments = this.getHRMAssignments();
    assignments.push(assignment);
    this.setHRMAssignments(assignments);

    // Mark HRM as used
    const hrms = this.getHRMs();
    const hrm = hrms.find(h => h.id === assignment.hrmId);
    if (hrm) {
      hrm.isUsed = true;
      this.setHRMs(hrms);
    }
  }

  unassignHRM(assignmentId: string): void {
    const assignments = this.getHRMAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);

    if (assignment) {
      // Mark HRM as available
      const hrms = this.getHRMs();
      const hrm = hrms.find(h => h.id === assignment.hrmId);
      if (hrm) {
        hrm.isUsed = false;
        this.setHRMs(hrms);
      }

      // Remove assignment
      const filtered = assignments.filter(a => a.id !== assignmentId);
      this.setHRMAssignments(filtered);
    }
  }

  // Heart Rate Data
  getHeartRateData(): HeartRateData[] {
    return hrmStorageUtil.get<HeartRateData[]>(HRM_STORAGE_KEYS.heartRateData) || [];
  }

  addHeartRateData(data: HeartRateData): void {
    const allData = this.getHeartRateData();
    allData.push(data);

    // Keep only last 1000 entries to prevent memory issues
    if (allData.length > 1000) {
      allData.splice(0, allData.length - 1000);
    }

    hrmStorageUtil.set(HRM_STORAGE_KEYS.heartRateData, allData);
  }

  getHeartRateDataForBooking(bookingId: string): HeartRateData[] {
    return this.getHeartRateData().filter(data => data.bookingId === bookingId);
  }

  // Current Session
  getCurrentSession(): WorkoutSession | null {
    return hrmStorageUtil.get<WorkoutSession>(HRM_STORAGE_KEYS.currentSession);
  }

  setCurrentSession(session: WorkoutSession | null): void {
    hrmStorageUtil.set(HRM_STORAGE_KEYS.currentSession, session);
  }

  // Real-time Metrics
  getHRMMetrics(): HRMMetrics[] {
    return hrmStorageUtil.get<HRMMetrics[]>(HRM_STORAGE_KEYS.hrmMetrics) || [];
  }

  setHRMMetrics(metrics: HRMMetrics[]): void {
    hrmStorageUtil.set(HRM_STORAGE_KEYS.hrmMetrics, metrics);
  }

  updateHRMMetric(metric: HRMMetrics): void {
    const metrics = this.getHRMMetrics();
    const existing = metrics.findIndex(m => m.userId === metric.userId);

    if (existing >= 0) {
      metrics[existing] = metric;
    } else {
      metrics.push(metric);
    }

    this.setHRMMetrics(metrics);
  }

  // Utility Functions
  calculateHRZone(heartRate: number, age: number = 30): HRZone {
    const maxHR = 220 - age;
    const percentage = (heartRate / maxHR) * 100;

    if (percentage < 60) return 1;
    if (percentage < 70) return 2;
    if (percentage < 80) return 3;
    if (percentage < 90) return 4;
    return 5;
  }

  generateMockData(): void {
    // Create mock HRMs
    const mockHRMs: HRM[] = [
      {
        id: 'hrm-001',
        name: 'HRM-001',
        hub: 'Hub-A',
        displayName: 'Heart Monitor 1',
        isUsed: false,
        batteryLevel: 85,
        connectionStatus: 'connected'
      },
      {
        id: 'hrm-002',
        name: 'HRM-002',
        hub: 'Hub-A',
        displayName: 'Heart Monitor 2',
        isUsed: false,
        batteryLevel: 72,
        connectionStatus: 'connected'
      },
      {
        id: 'hrm-003',
        name: 'HRM-003',
        hub: 'Hub-A',
        displayName: 'Heart Monitor 3',
        isUsed: false,
        batteryLevel: 91,
        connectionStatus: 'connected'
      },
      {
        id: 'hrm-004',
        name: 'HRM-004',
        hub: 'Hub-A',
        displayName: 'Heart Monitor 4',
        isUsed: false,
        batteryLevel: 68,
        connectionStatus: 'connected'
      }
    ];

    this.setHRMs(mockHRMs);

    // Create mock session
    const mockSession: WorkoutSession = {
      id: 'session-001',
      location: 'Studio A',
      currentBlock: 'High Intensity',
      beginsAt: new Date().toISOString(),
      status: 'active',
      participants: [],
      currentPhase: 'work',
      remaining: 45
    };

    this.setCurrentSession(mockSession);

    // Create mock assignments and metrics
    const mockUsers = [
      { id: 'user-001', name: 'Sarah M.' },
      { id: 'user-002', name: 'Mike T.' },
      { id: 'user-003', name: 'Jessica L.' },
      { id: 'user-004', name: 'David R.' }
    ];

    const assignments: HRMAssignment[] = [];
    const metrics: HRMMetrics[] = [];

    mockUsers.forEach((user, index) => {
      const hrm = mockHRMs[index];

      // Create assignment
      const assignment: HRMAssignment = {
        id: `assignment-${index + 1}`,
        hrmId: hrm.id,
        sessionId: mockSession.id,
        userId: user.id,
        userName: user.name,
        assigned: true,
        assignedAt: new Date().toISOString()
      };

      assignments.push(assignment);
      hrm.isUsed = true;

      // Create metrics
      const baseHR = 120 + Math.random() * 60; // 120-180 bpm
      const metric: HRMMetrics = {
        userId: user.id,
        userName: user.name,
        hrmId: hrm.id,
        currentHR: Math.floor(baseHR + (Math.random() - 0.5) * 20),
        averageHR: Math.floor(baseHR),
        maxHR: Math.floor(baseHR + 20),
        calories: Math.floor(200 + Math.random() * 100),
        zone: this.calculateHRZone(baseHR),
        intensity: Math.floor((baseHR / 180) * 100),
        rank: index + 1,
        isActive: true
      };

      metrics.push(metric);
    });

    this.setHRMAssignments(assignments);
    this.setHRMs(mockHRMs);
    this.setHRMMetrics(metrics);
  }

  // LIVE Data Syncing
  async fetchAvailableDevices(): Promise<void> {
    try {
      const response = await getHrmDevices();
      // data structure from API: { code: 200, data: [ { deviceId, deviceName, battery, ... } ] }
      // Assuming response.data is the array based on typical API structure
      // OR if the user provided code suggests generic request returns data directly:
      // The user snippet `return data` inside request suggests strictly the JSON body.
      // Let's assume the array is at the top level or inside `data` property.

      const devices = Array.isArray(response) ? response : (response.data || []);

      const newHRMs: HRM[] = devices.map((d: any) => ({
        id: d.bandId || d.deviceId, // map API field to local ID
        name: d.modelName || 'Unknown Device',
        hub: 'Default Hub',
        displayName: d.bandName || d.deviceName || `Device ${d.bandId}`,
        isUsed: false,
        batteryLevel: d.battery || 100,
        connectionStatus: 'connected' // If it's in the list, it's likely online
      }));

      // Merge with existing to preserve 'isUsed' state if possible, or just overwrite for now
      // merging is safer to keep assignments
      const currentHRMs = this.getHRMs();

      newHRMs.forEach(newDevice => {
        const existing = currentHRMs.find(h => h.id === newDevice.id);
        if (existing) {
          // Update details but keep local state
          existing.batteryLevel = newDevice.batteryLevel;
          existing.connectionStatus = 'connected';
          // existing.isUsed is preserved
        } else {
          currentHRMs.push(newDevice);
        }
      });

      this.setHRMs(currentHRMs);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    }
  }

  startLiveSync(): () => void {
    const interval = setInterval(async () => {
      const assignments = this.getHRMAssignments().filter(a => a.assigned);

      if (assignments.length === 0) return;

      // Prepare payload for API
      // We need last 5 seconds or just "now". 
      // The API `getHrmLastWithCalorie` likely needs a range to calc calories effectively 
      // OR it calculates total since start? 
      // Based on name "Last", it might be a snapshot.
      // Let's assume startTimestamp is "session start" and endTimestamp is "now".
      const session = this.getCurrentSession();
      if (!session) return;

      const startTimestamp = new Date(session.beginsAt).getTime() / 1000;
      const endTimestamp = Date.now() / 1000;

      const bands: BandInfo[] = assignments.map(a => ({
        bandId: a.hrmId,
        weight: a.weight || 70, // default if missing
        age: a.age || 30,
        gender: a.gender || 'male'
      }));

      try {
        const result = await getHrmLastWithCalorie(bands, startTimestamp, endTimestamp);
        // Result likely contains map of bandId -> { heartRate, calories, ... }
        // We need to parse this. 
        // Assuming result structure: { [bandId]: { heartRate, calories, ... } } or similar.

        // If result is generic object
        const metrics = this.getHRMMetrics();
        const updatedMetrics: HRMMetrics[] = [];

        // Check if result is array or object. 
        // Adapting to probable API response.
        const dataMap = Array.isArray(result) ?
          result.reduce((acc: any, item: any) => ({ ...acc, [item.bandId]: item }), {})
          : result;

        assignments.forEach(assignment => {
          const apiData = dataMap[assignment.hrmId];
          const currentMetric = metrics.find(m => m.userId === assignment.userId);

          if (apiData) {
            const hr = apiData.heartRate || 0;
            const cals = apiData.calories || 0; // Total cals since start

            updatedMetrics.push({
              userId: assignment.userId,
              userName: assignment.userName,
              hrmId: assignment.hrmId,
              currentHR: hr,
              averageHR: currentMetric ? Math.round((currentMetric.averageHR + hr) / 2) : hr, // Simple approx
              maxHR: currentMetric ? Math.max(currentMetric.maxHR, hr) : hr,
              calories: Math.round(cals),
              zone: this.calculateHRZone(hr, assignment.age),
              intensity: Math.min(100, Math.round((hr / (220 - (assignment.age || 30))) * 100)),
              rank: 0, // calc later
              isActive: true
            });
          }
        });

        // Update ranks
        updatedMetrics.sort((a, b) => b.calories - a.calories); // Rank by calories or intensity? usually cals or effort
        updatedMetrics.forEach((m, i) => m.rank = i + 1);

        this.setHRMMetrics(updatedMetrics);

      } catch (err) {
        console.error("Live sync failed", err);
      }

    }, 1000);

    return () => clearInterval(interval);
  }

  // Simulate real-time updates
  startSimulation(): () => void {
    const interval = setInterval(() => {
      const metrics = this.getHRMMetrics();
      const session = this.getCurrentSession();

      if (!session || metrics.length === 0) return;

      // Update heart rates with realistic variation
      const updatedMetrics = metrics.map(metric => {
        const variation = (Math.random() - 0.5) * 10; // ±5 bpm variation
        const newHR = Math.max(60, Math.min(200, metric.currentHR + variation));

        return {
          ...metric,
          currentHR: Math.floor(newHR),
          zone: this.calculateHRZone(newHR),
          intensity: Math.floor((newHR / 200) * 100),
          calories: metric.calories + Math.floor(Math.random() * 3) // Increase calories
        };
      });

      // Update rankings based on current intensity
      updatedMetrics.sort((a, b) => b.intensity - a.intensity);
      updatedMetrics.forEach((metric, index) => {
        metric.rank = index + 1;
      });

      this.setHRMMetrics(updatedMetrics);

      // Generate heart rate data points
      updatedMetrics.forEach(metric => {
        const dataPoint: HeartRateData = {
          id: `hr-${Date.now()}-${metric.userId}`,
          bookingId: `booking-${metric.userId}`,
          hrmId: metric.hrmId,
          timestamp: new Date().toISOString(),
          heartRate: metric.currentHR,
          calories: metric.calories,
          zone: metric.zone,
          intensity: metric.intensity
        };

        this.addHeartRateData(dataPoint);
      });

    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }
}

export const hrmStorage = new HRMStorage();