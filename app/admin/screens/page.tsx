import React from 'react'
import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function ScreensPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('screens').select('*').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Screens</h2>
      <ul>
        {data?.map((s: any) => (
          <li key={s.id} className="py-2 border-b border-slate-700">{s.name} — {s.code}</li>
        ))}
      </ul>
    </div>
  )
}
