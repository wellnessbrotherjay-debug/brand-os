import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function ReportsPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('analytics_events').select('*').eq('hotel_id', hotel_id).limit(50).order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Reports</h2>
      <ul>
        {data?.map((r: any) => (
          <li key={r.id} className="py-2 border-b border-slate-700">{r.event_type} — {JSON.stringify(r.payload)}</li>
        ))}
      </ul>
    </div>
  )
}
