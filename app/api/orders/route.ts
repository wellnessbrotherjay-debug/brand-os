import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { hotel_id, order, items } = body
    if (!hotel_id || !order) return NextResponse.json({ error: 'hotel_id and order required' }, { status: 400 })

    const supabase = getServerSupabaseClient()

    // create order
    const { data: orderData, error: orderError } = await supabase.from('orders').insert([{ ...order, hotel_id }]).select().single()
    if (orderError) throw orderError

    // insert items if provided
    if (Array.isArray(items) && items.length) {
      const withOrder = items.map((it: any) => ({ ...it, order_id: orderData.id, hotel_id }))
      const { error: itemsError } = await supabase.from('order_items').insert(withOrder)
      if (itemsError) throw itemsError
    }

    return NextResponse.json({ order: orderData })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { hotel_id, order_id, updates } = body
    if (!hotel_id || !order_id) return NextResponse.json({ error: 'hotel_id and order_id required' }, { status: 400 })

    const supabase = getServerSupabaseClient()
    const { data, error } = await supabase.from('orders').update(updates).eq('id', order_id).eq('hotel_id', hotel_id).select().single()
    if (error) throw error
    return NextResponse.json({ order: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
