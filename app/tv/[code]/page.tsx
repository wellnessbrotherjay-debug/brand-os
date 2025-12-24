import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function TVPage({ params }: { params: { code: string } }) {
  const code = params.code
  const supabase = getServerSupabaseClient()

  // find screen by code, then playlist and items
  const { data: screens } = await supabase.from('screens').select('*').eq('code', code).limit(1).single()
  if (!screens) return <div className="p-6">Screen not found</div>

  const hotel_id = screens.hotel_id

  const { data: playlistMap } = await supabase.from('playlists').select('*, playlist_items(*)').eq('hotel_id', hotel_id).eq('id', screens.playlist_id).limit(1).single()

  // fetch active workouts and menu
  const { data: workouts } = await supabase.from('workouts').select('*').eq('hotel_id', hotel_id).limit(10)
  const { data: menu } = await supabase.from('menu_items').select('*').eq('hotel_id', hotel_id).eq('active', true).limit(10)

  return (
    <div className="min-h-screen bg-[#001f3f] text-white p-6">
      <h1 className="text-2xl mb-4">{screens.name} — TV</h1>

      <section className="mb-6">
        <h2 className="text-xl mb-2">Playlist</h2>
        <div className="grid grid-cols-3 gap-3">
          {playlistMap?.playlist_items?.map((it: any) => (
            <div key={it.id} className="bg-slate-800 p-4 rounded">
              <div className="font-semibold">{it.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl mb-2">Workouts</h2>
        <div className="grid grid-cols-4 gap-3">
          {workouts?.map((w: any) => (
            <div key={w.id} className="bg-slate-800 p-4 rounded">
              <div className="font-semibold">{w.name}</div>
              <div className="text-sm text-slate-300">{w.duration} mins</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-2">Menu</h2>
        <div className="grid grid-cols-4 gap-3">
          {menu?.map((m: any) => (
            <div key={m.id} className="bg-slate-800 p-4 rounded">
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-slate-300">{m.price}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
