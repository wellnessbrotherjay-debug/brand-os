
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// Use Service Role Key to bypass RLS
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, action, data, id } = body;

        console.log(`[Persist API] ${action} on ${table}`, { id });

        if (!table || !action) {
            return NextResponse.json({ error: 'Missing table or action' }, { status: 400 });
        }

        let result;
        let query = supabase.from(table as any);

        switch (action) {
            case 'insert':
                if (!data) return NextResponse.json({ error: 'Missing data for insert' }, { status: 400 });
                result = await query.insert(data);
                break;
            case 'update':
                if (!id || !data) return NextResponse.json({ error: 'Missing id or data for update' }, { status: 400 });
                result = await query.update(data).eq('id', id);
                break;
            case 'delete':
                if (!id) return NextResponse.json({ error: 'Missing id for delete' }, { status: 400 });
                result = await query.delete().eq('id', id);
                break;
            case 'upsert':
                if (!data) return NextResponse.json({ error: 'Missing data for upsert' }, { status: 400 });
                // For upsert, we typically match on Primary Key
                result = await query.upsert(data);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (result.error) {
            console.error('[Persist API Error DB]:', result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.count });

    } catch (error: any) {
        console.error('[Persist API Error]:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
