"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Equipment {
  id: string
  display_name: string
  slug: string
}

export default function TestSupabasePage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if Supabase is configured
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured. Please check your environment variables.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("equipment")
          .select("id, display_name, slug")
          .order("display_name", { ascending: true })
        
        if (error) throw error
        setEquipment(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [isSupabaseConfigured])

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">🏋️‍♂️ Equipment List</h1>
        <p className="text-red-500">❌ Error: {error}</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">🏋️‍♂️ Equipment List</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : equipment.length > 0 ? (
        <ul className="space-y-2">
          {equipment.map((item) => {
            return (
              <li key={item.id} className="p-2 bg-gray-50 rounded">
                <div className="font-medium">{item.display_name}</div>
                <div className="text-sm text-gray-500">{item.slug}</div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>No equipment found.</p>
      )}
    </main>
  )
}
