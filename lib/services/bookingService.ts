/**
 * Booking Service
 * Handles all database operations for the studio class booking system
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TYPES
// ============================================================================

export interface Coach {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    certifications: string[];
    image_url: string;
}

export interface StudioClass {
    id: string;
    slug: string;
    name: string;
    description: string;
    duration_minutes: number;
    intensity: 'Low' | 'Medium' | 'High';
    max_spots: number;
    cover_image_url: string;
    focus_area: 'Core' | 'Glutes' | 'Full Body';
}

export interface ClassSchedule {
    id: string;
    class_id: string;
    coach_id: string;
    scheduled_time: string;
    location: string;
    available_spots: number;
    status: 'scheduled' | 'cancelled' | 'completed';
    // Joined data
    studio_class?: StudioClass;
    coach?: Coach;
    booked_count?: number;
}

export interface ClassBooking {
    id: string;
    user_id: string;
    schedule_id: string;
    booking_status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    booked_at: string;
    cancelled_at?: string;
    // Joined data
    class_schedule?: ClassSchedule;
}

// ============================================================================
// SCHEDULE QUERIES
// ============================================================================

/**
 * Get upcoming class schedules for the next 7 days
 */
export async function getUpcomingClasses(startDate?: Date, days: number = 7) {
    const start = startDate || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const { data, error } = await supabase
        .from('class_schedules')
        .select(`
      *,
      studio_class:studio_classes(*),
      coach:coaches(*)
    `)
        .gte('scheduled_time', start.toISOString())
        .lt('scheduled_time', end.toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_time', { ascending: true });

    if (error) {
        console.error('Error fetching upcoming classes:', error);
        throw error;
    }

    return data as ClassSchedule[];
}

/**
 * Get a specific class schedule by ID
 */
export async function getClassSchedule(scheduleId: string) {
    const { data, error } = await supabase
        .from('class_schedules')
        .select(`
      *,
      studio_class:studio_classes(*),
      coach:coaches(*)
    `)
        .eq('id', scheduleId)
        .single();

    if (error) {
        console.error('Error fetching class schedule:', error);
        throw error;
    }

    return data as ClassSchedule;
}

// ============================================================================
// BOOKING QUERIES
// ============================================================================

/**
 * Get all bookings for a specific user
 */
export async function getUserBookings(userId: string, includeCompleted: boolean = false) {
    let query = supabase
        .from('class_bookings')
        .select(`
      *,
      class_schedule:class_schedules(
        *,
        studio_class:studio_classes(*),
        coach:coaches(*)
      )
    `)
        .eq('user_id', userId);

    if (!includeCompleted) {
        query = query.in('booking_status', ['confirmed']);
    }

    query = query.order('booked_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
    }

    return data as ClassBooking[];
}

/**
 * Get the next upcoming booking for a user
 */
export async function getNextUpcomingBooking(userId: string) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('class_bookings')
        .select(`
      *,
      class_schedule:class_schedules(
        *,
        studio_class:studio_classes(*),
        coach:coaches(*)
      )
    `)
        .eq('user_id', userId)
        .eq('booking_status', 'confirmed')
        .gte('class_schedule.scheduled_time', now)
        .order('class_schedule.scheduled_time', { ascending: true })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        console.error('Error fetching next booking:', error);
        throw error;
    }

    return data as ClassBooking;
}

/**
 * Get a specific booking by ID
 */
export async function getBooking(bookingId: string) {
    const { data, error } = await supabase
        .from('class_bookings')
        .select(`
      *,
      class_schedule:class_schedules(
        *,
        studio_class:studio_classes(*),
        coach:coaches(*)
      )
    `)
        .eq('id', bookingId)
        .single();

    if (error) {
        console.error('Error fetching booking:', error);
        throw error;
    }

    return data as ClassBooking;
}

// ============================================================================
// BOOKING MUTATIONS
// ============================================================================

/**
 * Create a new booking for a user
 */
export async function createBooking(userId: string, scheduleId: string) {
    // First, check if there are available spots
    const { data: schedule, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('available_spots')
        .eq('id', scheduleId)
        .single();

    if (scheduleError) {
        console.error('Error checking availability:', scheduleError);
        throw scheduleError;
    }

    if (schedule.available_spots <= 0) {
        throw new Error('No spots available for this class');
    }

    // Create the booking
    const { data, error } = await supabase
        .from('class_bookings')
        .insert({
            user_id: userId,
            schedule_id: scheduleId,
            booking_status: 'confirmed'
        })
        .select(`
      *,
      class_schedule:class_schedules(
        *,
        studio_class:studio_classes(*),
        coach:coaches(*)
      )
    `)
        .single();

    if (error) {
        console.error('Error creating booking:', error);
        throw error;
    }

    // Decrement available spots
    await supabase
        .from('class_schedules')
        .update({ available_spots: schedule.available_spots - 1 })
        .eq('id', scheduleId);

    return data as ClassBooking;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string) {
    // Get the booking to find the schedule
    const { data: booking, error: bookingError } = await supabase
        .from('class_bookings')
        .select('schedule_id, booking_status')
        .eq('id', bookingId)
        .single();

    if (bookingError) {
        console.error('Error fetching booking for cancellation:', bookingError);
        throw bookingError;
    }

    if (booking.booking_status !== 'confirmed') {
        throw new Error('Only confirmed bookings can be cancelled');
    }

    // Update booking status
    const { data, error } = await supabase
        .from('class_bookings')
        .update({
            booking_status: 'cancelled',
            cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

    if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
    }

    // Increment available spots
    const { data: schedule } = await supabase
        .from('class_schedules')
        .select('available_spots')
        .eq('id', booking.schedule_id)
        .single();

    if (schedule) {
        await supabase
            .from('class_schedules')
            .update({ available_spots: schedule.available_spots + 1 })
            .eq('id', booking.schedule_id);
    }

    return data;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get count of bookings for a specific schedule
 */
export async function getBookingCount(scheduleId: string) {
    const { count, error } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_id', scheduleId)
        .eq('booking_status', 'confirmed');

    if (error) {
        console.error('Error getting booking count:', error);
        return 0;
    }

    return count || 0;
}
