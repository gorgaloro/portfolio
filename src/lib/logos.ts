export interface LogoRecord {
  id?: string | number
  name?: string
  logo_url?: string
  website_url?: string
  // Allow arbitrary fields so users with different schemas can still render
  [key: string]: unknown
}

// Fetch logos from Supabase REST API using public anon key
// Expected columns: id, name, logo_url, website_url
// If your column names differ, you can either:
//  - adjust the select below, or
//  - map the fields in the component before rendering.
export async function getLogos(options?: {
  select?: string
  table?: string
  limit?: number
  signal?: AbortSignal
}): Promise<LogoRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const table = options?.table || process.env.NEXT_PUBLIC_SUPABASE_LOGOS_TABLE || 'companies'
  const select = options?.select || process.env.NEXT_PUBLIC_SUPABASE_LOGOS_SELECT || 'id,name,logo_url,website_url'
  const limit = options?.limit || Number(process.env.NEXT_PUBLIC_SUPABASE_LOGOS_LIMIT || 100)

  if (!url || !anonKey) {
    // In dev, return empty and log a helpful message; in prod, just return empty
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[LogoGrid] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Returning empty list.')
    }
    return []
  }

  const restUrl = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(select)}&limit=${limit}`

  const res = await fetch(restUrl, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept': 'application/json',
    },
    // Revalidate periodically so updates appear without redeploy
    next: { revalidate: 3600 },
    signal: options?.signal,
  })

  if (!res.ok) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[LogoGrid] Supabase fetch failed: ${res.status} ${res.statusText}`)
    }
    return []
  }

  const data = (await res.json()) as LogoRecord[]
  return Array.isArray(data) ? data : []
}
