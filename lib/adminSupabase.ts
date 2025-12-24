import { getServerSupabaseClient } from "@/lib/supabaseClient"
import type { Database } from "@/lib/database.types"
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

type LibraryTableName = "exercise_library" | "equipment_library"

type LibraryRow<TableName extends LibraryTableName> = TableName extends "exercise_library"
  ? Database["public"]["Tables"]["exercise_library"]["Row"]
  : Database["public"]["Tables"]["equipment_library"]["Row"]

const SCHEMA_RELOAD_RPC = "reload_schema_cache"

const isSchemaCacheError = (error: PostgrestError | null): boolean =>
  Boolean(error && error.code === "PGRST205")

const reloadSchemaCache = async (supabase: SupabaseClient<Database>) => {
  try {
    await supabase.rpc(SCHEMA_RELOAD_RPC)
  } catch (err) {
    console.warn("Failed to reload Supabase schema cache", err)
  }
}

export async function fetchLibraryRows<TableName extends LibraryTableName>(
  tableName: TableName,
  selection: string
): Promise<LibraryRow<TableName>[]> {
  const supabase = getServerSupabaseClient()
  let cacheReloaded = false

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select(selection)
      .order("created_at", { ascending: false })

    if (!error) {
      return (data ?? []) as LibraryRow<TableName>[]
    }

    if (!cacheReloaded && isSchemaCacheError(error)) {
      cacheReloaded = true
      await reloadSchemaCache(supabase)
      continue
    }

    throw error
  }
}
