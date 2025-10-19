import { NextResponse } from 'next/server'

export const revalidate = 1800 // 30 minutes

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const table = process.env.NEXT_PUBLIC_SUPABASE_COMPANY_TABLE || 'company_profiles'
  const tagColumn = process.env.NEXT_PUBLIC_SUPABASE_TAG_COLUMN || 'classification_tags'
  const activeColumn = process.env.NEXT_PUBLIC_SUPABASE_COMPANY_ACTIVE_COLUMN || 'active'

  if (!url || !anonKey) {
    return NextResponse.json({ tags: [] }, { status: 200 })
  }

  // Select both tag and potential active flag; if active doesn't exist, it will come back as undefined
  const restUrl = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(tagColumn)},${encodeURIComponent(activeColumn)}&limit=5000`

  const res = await fetch(restUrl, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
    next: { revalidate },
  })

  if (!res.ok) {
    return NextResponse.json({ tags: [] }, { status: 200 })
  }

  const rows = (await res.json()) as Array<Record<string, unknown>>
  const set = new Set<string>()
  const normalizeActive = (v: unknown): boolean | undefined => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v !== 0
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase()
      if (['true', 't', '1', 'yes', 'y', 'checked'].includes(s)) return true
      if (['false', 'f', '0', 'no', 'n', 'unchecked'].includes(s)) return false
    }
    return undefined
  }
  const anyActivePresent = rows.some((r) => typeof r[activeColumn] !== 'undefined')
  for (const row of rows) {
    const isActive = normalizeActive(row[activeColumn])
    if (anyActivePresent && isActive !== true) continue
    const raw = row[tagColumn]
    if (Array.isArray(raw)) {
      for (const t of raw) if (typeof t === 'string' && t.trim()) set.add(t.trim())
    } else if (typeof raw === 'string') {
      // support comma/semicolon-separated string
      raw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((t) => set.add(t))
    }
  }

  const tags = Array.from(set).sort((a, b) => a.localeCompare(b))
  return NextResponse.json({ tags }, { status: 200 })
}
