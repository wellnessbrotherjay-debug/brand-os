import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function PlaylistsPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('playlists').select('*').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Playlists</h2>
      <ul>
        {data?.map((p: any) => (
          <li key={p.id} className="py-2 border-b border-slate-700">{p.name}</li>
        ))}
      </ul>
    </div>
  )
}
