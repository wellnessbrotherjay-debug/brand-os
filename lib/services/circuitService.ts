import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type CircuitSession = Database['public']['Tables']['circuit_sessions']['Row'];

export const circuitService = {
    // --- 1. SETUP ---

    async createSession(circuitId: string) {
        const { data, error } = await supabase
            .from('circuit_sessions')
            .insert({
                circuit_id: circuitId,
                status: 'setup',
                current_round: 1,
                current_phase: 'setup' // waiting for start
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async registerDevice(sessionId: string, deviceType: 'tablet' | 'controller', stationNumber?: number) {
        const deviceId = `dev_${Math.random().toString(36).substr(2, 9)}`;

        await supabase
            .from('circuit_devices')
            .insert({
                session_id: sessionId,
                device_id: deviceId,
                device_type: deviceType,
                assigned_station: stationNumber
            });

        return deviceId;
    },

    // --- 2. CONTROLLER ACTIONS (Phone) ---

    async startCircuit(sessionId: string) {
        const now = new Date().toISOString();
        await supabase
            .from('circuit_sessions')
            .update({
                status: 'active',
                current_phase: 'work', // Jump straight to work for demo
                phase_start_time: now,
                started_at: now
            })
            .eq('id', sessionId);
    },

    async pauseCircuit(sessionId: string) {
        await supabase
            .from('circuit_sessions')
            .update({
                status: 'paused',
                paused_at: new Date().toISOString()
            })
            .eq('id', sessionId);
    },

    async nextPhase(sessionId: string, nextPhase: string) {
        await supabase
            .from('circuit_sessions')
            .update({
                current_phase: nextPhase,
                phase_start_time: new Date().toISOString()
            })
            .eq('id', sessionId);
    },

    // --- 3. REALTIME SUBSCRIPTION ---

    subscribeToSession(sessionId: string, onUpdate: (payload: any) => void) {
        return supabase
            .channel(`circuit_session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'circuit_sessions',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {
                    onUpdate(payload.new);
                }
            )
            .subscribe();
    }
};
