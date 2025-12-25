
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// Use Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Persist API] Init');
console.log('[Persist API] URL defined:', !!supabaseUrl);
console.log('[Persist API] Service Key defined:', !!serviceKey);
if (serviceKey) console.log('[Persist API] Service Key start:', serviceKey.substring(0, 10));

const supabase = createClient<Database>(
    supabaseUrl!,
    serviceKey!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, action, data, id } = body;

        console.log(`[Persist API] ${action} on ${table}`, { id, dataSummary: data ? Object.keys(data) : 'none' });

        if (!table || !action) {
            return NextResponse.json({ error: 'Missing table or action' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'select':
                // For select, we MUST call select() first to get a FilterBuilder
                let selectQuery = supabase.from(table as any).select('*');
                if (data && data.query) {
                    for (const [key, value] of Object.entries(data.query)) {
                        selectQuery = selectQuery.eq(key, value);
                    }
                }
                result = await selectQuery;
                break;
            case 'insert':
                if (!data) return NextResponse.json({ error: 'Missing data for insert' }, { status: 400 });
                result = await supabase.from(table as any).insert(data);
                break;
            case 'update':
                if (!id || !data) return NextResponse.json({ error: 'Missing id or data for update' }, { status: 400 });
                result = await supabase.from(table as any).update(data).eq('id', id);
                break;
            case 'delete':
                if (!id) return NextResponse.json({ error: 'Missing id for delete' }, { status: 400 });
                result = await supabase.from(table as any).delete().eq('id', id);
                break;
            case 'upsert':
                if (!data) return NextResponse.json({ error: 'Missing data for upsert' }, { status: 400 });
                result = await supabase.from(table as any).upsert(data);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (result.error) {
            console.error('[Persist API Error DB]:', result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.count, data: result.data });

    } catch (error: any) {
        console.error('[Persist API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
