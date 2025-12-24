/**
 * HRM Device Integration Service
 * 
 * This service handles:
 * - HRM device pairing when user books a class
 * - Real-time heart rate data sync during workout
 * - Post-workout data aggregation and analysis
 * 
 * Integration points for your HRM software:
 * - Replace mock functions with actual API calls
 * - Configure WebSocket for real-time data
 * - Set up device pairing protocol
 */

export interface HRMDevice {
    deviceId: string;
    deviceName: string;
    batteryLevel: number;
    isConnected: boolean;
    lastSync: Date;
}

export interface HRMWorkoutData {
    sessionId: string;
    userId: string;
    classId: string;
    deviceId: string;
    startTime: Date;
    endTime?: Date;
    heartRateData: HeartRatePoint[];
    summary?: WorkoutSummary;
}

export interface HeartRatePoint {
    timestamp: Date;
    heartRate: number;
    zone: 1 | 2 | 3 | 4 | 5; // HR zones
}

export interface WorkoutSummary {
    avgHeartRate: number;
    maxHeartRate: number;
    minHeartRate: number;
    caloriesBurned: number;
    duration: number; // minutes
    zones: {
        zone1: number; // minutes in each zone
        zone2: number;
        zone3: number;
        zone4: number;
        zone5: number;
    };
}

class HRMService {
    private apiBaseUrl: string;
    private wsConnection: WebSocket | null = null;

    constructor() {
        // Configure your HRM software API endpoint
        this.apiBaseUrl = process.env.NEXT_PUBLIC_HRM_API_URL || 'https://api.yourhrmsoftware.com';
    }

    /**
     * Pair HRM device when user books a class
     * Call this after successful booking
     */
    async pairDeviceForBooking(userId: string, bookingId: string): Promise<HRMDevice> {
        try {
            // TODO: Replace with actual HRM API call
            const response = await fetch(`${this.apiBaseUrl}/devices/pair`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    userId,
                    bookingId,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to pair HRM device');
            }

            const device = await response.json();

            // Store device pairing in local storage for quick access
            localStorage.setItem(`hrm_device_${bookingId}`, JSON.stringify(device));

            return device;
        } catch (error) {
            console.error('HRM pairing error:', error);

            // Return mock device for development
            return this.getMockDevice(userId, bookingId);
        }
    }

    /**
     * Start workout session and begin real-time HR monitoring
     */
    async startWorkoutSession(userId: string, classId: string, deviceId: string): Promise<string> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sessions/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    userId,
                    classId,
                    deviceId,
                    startTime: new Date().toISOString()
                })
            });

            const { sessionId } = await response.json();

            // Start WebSocket connection for real-time data
            this.connectWebSocket(sessionId);

            return sessionId;
        } catch (error) {
            console.error('Failed to start workout session:', error);
            return `mock_session_${Date.now()}`;
        }
    }

    /**
     * Connect to WebSocket for real-time heart rate updates
     */
    private connectWebSocket(sessionId: string) {
        const wsUrl = process.env.NEXT_PUBLIC_HRM_WS_URL || 'wss://ws.yourhrmsoftware.com';

        try {
            this.wsConnection = new WebSocket(`${wsUrl}/sessions/${sessionId}`);

            this.wsConnection.onopen = () => {
                console.log('HRM WebSocket connected');
            };

            this.wsConnection.onmessage = (event) => {
                const hrData = JSON.parse(event.data);
                this.handleRealtimeHRData(hrData);
            };

            this.wsConnection.onerror = (error) => {
                console.error('HRM WebSocket error:', error);
            };

            this.wsConnection.onclose = () => {
                console.log('HRM WebSocket disconnected');
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    /**
     * Handle real-time heart rate data
     */
    private handleRealtimeHRData(data: any) {
        // Emit custom event for components to listen to
        const event = new CustomEvent('hrm-data-update', { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * End workout session and get final summary
     */
    async endWorkoutSession(sessionId: string): Promise<WorkoutSummary> {
        try {
            // Close WebSocket
            if (this.wsConnection) {
                this.wsConnection.close();
                this.wsConnection = null;
            }

            const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const summary = await response.json();
            return summary;
        } catch (error) {
            console.error('Failed to end workout session:', error);
            return this.getMockSummary();
        }
    }

    /**
     * Get workout results for display
     */
    async getWorkoutResults(sessionId: string): Promise<HRMWorkoutData> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/results`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to get workout results:', error);
            return this.getMockWorkoutData(sessionId);
        }
    }

    /**
     * Get class leaderboard
     */
    async getClassLeaderboard(classId: string, sessionDate: Date): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/leaderboard?classId=${classId}&date=${sessionDate.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                }
            );

            return await response.json();
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return this.getMockLeaderboard();
        }
    }

    /**
     * Sync device data (manual sync if needed)
     */
    async syncDevice(deviceId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/devices/${deviceId}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Device sync failed:', error);
            return false;
        }
    }

    // Helper methods

    private getAuthToken(): string {
        // TODO: Implement your auth token retrieval
        return localStorage.getItem('auth_token') || '';
    }

    private getMockDevice(userId: string, bookingId: string): HRMDevice {
        return {
            deviceId: `HRM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            deviceName: 'Polar H10',
            batteryLevel: 85,
            isConnected: true,
            lastSync: new Date()
        };
    }

    private getMockSummary(): WorkoutSummary {
        return {
            avgHeartRate: 135,
            maxHeartRate: 178,
            minHeartRate: 98,
            caloriesBurned: 650,
            duration: 75,
            zones: {
                zone1: 15,
                zone2: 25,
                zone3: 20,
                zone4: 10,
                zone5: 5
            }
        };
    }

    private getMockWorkoutData(sessionId: string): HRMWorkoutData {
        return {
            sessionId,
            userId: 'mock_user',
            classId: 'core-foundation',
            deviceId: 'HRM-MOCK',
            startTime: new Date(Date.now() - 75 * 60 * 1000),
            endTime: new Date(),
            heartRateData: [],
            summary: this.getMockSummary()
        };
    }

    private getMockLeaderboard(): any[] {
        return [
            { rank: 1, name: "Sarah J", calories: 720, avgHR: 145 },
            { rank: 2, name: "Mike T", calories: 680, avgHR: 142 },
            { rank: 3, name: "You", calories: 650, avgHR: 135, isMe: true },
        ];
    }
}

// Export singleton instance
export const hrmService = new HRMService();

// Export helper hooks for React components
export function useHRMRealtime(sessionId: string, onUpdate: (data: any) => void) {
    if (typeof window === 'undefined') return;

    const handleUpdate = (event: any) => {
        onUpdate(event.detail);
    };

    window.addEventListener('hrm-data-update', handleUpdate);

    return () => {
        window.removeEventListener('hrm-data-update', handleUpdate);
    };
}
