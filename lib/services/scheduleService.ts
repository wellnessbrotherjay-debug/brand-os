import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export type ScheduleItem = Database['public']['Tables']['user_schedule']['Row'];

export const scheduleService = {

    async getScheduleForDate(userId: string, date: string) {
        // Fetch schedule items
        const { data: scheduleItems, error } = await supabase
            .from('user_schedule')
            .select('*')
            .eq('user_id', userId)
            .eq('scheduled_date', date);

        if (error) throw error;

        // Enrich with workout details if applicable
        const enrichedItems = await Promise.all(scheduleItems.map(async (item) => {
            if (item.item_type === 'workout') {
                const { data: workout } = await supabase
                    .from('workouts')
                    .select('title')
                    .eq('id', item.reference_id)
                    .single();
                return { ...item, title: workout?.title || 'Workout' };
            }
            return { ...item, title: item.item_type === 'meal' ? 'Meal' : 'Activity' };
        }));

        return enrichedItems;
    },

    async addToSchedule(userId: string, date: string, itemType: 'workout' | 'class', referenceId: string) {
        const { data, error } = await supabase
            .from('user_schedule')
            .insert({
                user_id: userId,
                scheduled_date: date,
                item_type: itemType,
                reference_id: referenceId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async markComplete(scheduleId: string) {
        const { error } = await supabase
            .from('user_schedule')
            .update({ status: 'completed' })
            .eq('id', scheduleId);

        if (error) throw error;
    },

    async getUpcoming(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('user_schedule')
            .select('*')
            .eq('user_id', userId)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .limit(5);

        if (error) throw error;
        return data;
    }
};
