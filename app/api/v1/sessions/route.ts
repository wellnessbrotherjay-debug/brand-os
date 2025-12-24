import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = createAdminClient();
    const today = new Date().toISOString();

    // Fetch sessions starting from today onwards
    const { data: sessions, error } = await supabase
        .from('gym_sessions')
        .select('*')
        .gte('starts_at', today)
        .order('starts_at', { ascending: true });

    if (error) {
        console.error("Error fetching sessions:", error);
        // Fallback to mock data if table doesn't exist yet (migration pending)
        if (error.code === '42P01') { // undefined_table
            return NextResponse.json({
                data: [
                    {
                        id: "mock-session-1",
                        name: "Full Body Blast (Mock)",
                        instructor_name: "Coach Mike",
                        starts_at: new Date(Date.now() + 86400000).toISOString(),
                        price_drop_in: 150,
                        capacity: 20,
                        booked: 5,
                        access_options_credits: { drop_in: true, membership: true },
                        description: "High intensity interval training. (Run migration to see real data)"
                    }
                ]
            });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to match Mini Program expectation
    const formatted = sessions?.map(s => ({
        ...s,
        name: s.title, // Mini program expects 'name'
        instructor: s.instructor_name, // Mini program expects 'instructor'
        start_time: s.starts_at, // Mini program expects 'start_time'
        price: s.price_drop_in,
        access_options_credits: { drop_in: true, membership: true } // Default for now
    }));

    return NextResponse.json({
        data: formatted
    });
}
