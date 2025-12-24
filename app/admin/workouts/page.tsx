import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function WorkoutsPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('workouts').select('*').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Workouts</h2>
      <ul>
        {data?.map((w: any) => (
          <li key={w.id} className="py-2 border-b border-slate-700">{w.name}</li>
        ))}
      </ul>
    </div>
  )
}
