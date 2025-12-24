import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function InventoryPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('inventory').select('*').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Inventory</h2>
      <ul>
        {data?.map((i: any) => (
          <li key={i.id} className="py-2 border-b border-slate-700">{i.name} — {i.quantity}</li>
        ))}
      </ul>
    </div>
  )
}
