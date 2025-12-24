import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const hotel_id = url.searchParams.get('hotel_id') || ''
    if (!hotel_id) return NextResponse.json({ error: 'hotel_id required' }, { status: 400 })

    const supabase = getServerSupabaseClient()

    // fetch active menu items and join recipe/macros
    const { data, error } = await supabase
      .from('menu_items')
      .select(`*, recipes(*), macros(*)`)
      .eq('hotel_id', hotel_id)
      .eq('active', true)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
