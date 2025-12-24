import { getServerSupabaseClient } from '@/lib/supabaseClient'

export default async function VideosPage({ searchParams }: any) {
  const hotel_id = searchParams?.hotel_id || ''
  const supabase = getServerSupabaseClient()
  const { data } = await supabase.from('videos').select('*').eq('hotel_id', hotel_id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Videos</h2>
      <ul>
        {data?.map((v: any) => (
          <li key={v.id} className="py-2 border-b border-slate-700">{v.title}</li>
        ))}
      </ul>
    </div>
  )
}
