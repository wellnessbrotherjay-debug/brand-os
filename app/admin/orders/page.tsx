import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function OrdersPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('orders').select('*, order_items(*)').eq('hotel_id', hotel_id).order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Orders</h2>
      <ul>
        {data?.map((o: any) => (
          <li key={o.id} className="py-2 border-b border-slate-700">
            <div className="flex justify-between">
              <div>
                <strong>{o.id}</strong> — {o.status}
              </div>
              <div>{new Date(o.created_at).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
