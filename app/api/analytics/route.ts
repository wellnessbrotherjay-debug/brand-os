import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { hotel_id, screen_code, event_type, payload } = body
    if (!hotel_id || !event_type) return NextResponse.json({ error: 'hotel_id and event_type required' }, { status: 400 })

    const supabase = getServerSupabaseClient()
    const { data, error } = await supabase.from('analytics_events').insert([{ hotel_id, screen_code, event_type, payload }]).select().single()
    if (error) throw error
    return NextResponse.json({ event: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
