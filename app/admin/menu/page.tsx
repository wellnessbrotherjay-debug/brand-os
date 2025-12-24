import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function MenuPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('menu_items').select('*, recipes(*)').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Menu</h2>
      <ul>
        {data?.map((m: any) => (
          <li key={m.id} className="py-2 border-b border-slate-700">{m.name} — {m.price}</li>
        ))}
      </ul>
    </div>
  )
}
