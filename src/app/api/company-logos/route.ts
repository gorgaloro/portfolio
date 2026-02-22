import { NextResponse } from 'next/server'

export const revalidate = 900 // 15 minutes

function toArrayTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string').map((s) => s.trim()).filter(Boolean)
  if (typeof raw === 'string') return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
  return []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag') || undefined
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Number(limitParam || 5000) || 5000, 5000)
  const wantDebug = searchParams.get('debug') === '1' && process.env.NODE_ENV !== 'production'

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const authKey = serverKey || anonKey

  const table = process.env.NEXT_PUBLIC_SUPABASE_COMPANY_TABLE || 'company_profiles'
  const idCol = process.env.NEXT_PUBLIC_SUPABASE_COMPANY_ID_COLUMN || 'id'

  // Allow comma-separated candidates and provide sensible defaults
  const parseCandidates = (value: string | undefined, defaults: string[]) => {
    const arr = (value ? value.split(',') : defaults).map((s) => s.trim()).filter(Boolean)
    return Array.from(new Set(arr))
  }

  // Produce a normalized sort key that ignores leading articles
  const sortKey = (n: string): string => (n || '').trim().toLowerCase().replace(/^(the|a|an)\s+/, '')

  const logoFromWebsite = (website?: string): string => {
    if (!website) return ''
    try {
      const u = new URL(website)
      const host = u.hostname
      if (!host) return ''
      return `https://logo.clearbit.com/${host}?size=128&format=png`
    } catch {
      return ''
    }
  }

  const sanitizeWebsite = (val: string): string => {
    if (!val) return ''
    const s = String(val).trim()
    if (!s || s.toLowerCase() === 'unknown') return ''
    if (/^https?:\/\//i.test(s)) return s
    // Accept bare domains and prepend https://
    if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/.*)?$/i.test(s)) return `https://${s}`
    return ''
  }

  const humanizeFromHostname = (urlStr: string): string => {
    try {
      const u = new URL(urlStr)
      let host = u.hostname.toLowerCase()
      host = host.replace(/^www\./, '')
      const parts = host.split('.')
      const base = parts[0] || host
      const words = base.split(/[-_]/g)
      return words
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(' ')
    } catch {
      return ''
    }
  }

  const nameCols = parseCandidates(process.env.NEXT_PUBLIC_SUPABASE_COMPANY_NAME_COLUMN, [
    'name',
    'company_name',
    'company',
  ])
  const logoCols = parseCandidates(process.env.NEXT_PUBLIC_SUPABASE_COMPANY_LOGO_COLUMN, [
    'logo_url',
    'logo',
    'logo_uri',
    'logo_path',
    'logo_public_url',
  ])
  const websiteCols = parseCandidates(process.env.NEXT_PUBLIC_SUPABASE_COMPANY_WEBSITE_COLUMN, [
    'website',
    'website_url',
    'url',
    'homepage',
  ])
  const tagCols = parseCandidates(process.env.NEXT_PUBLIC_SUPABASE_TAG_COLUMN, [
    'classification_tags',
    'tags',
  ])
  const activeCols = parseCandidates(process.env.NEXT_PUBLIC_SUPABASE_COMPANY_ACTIVE_COLUMN, [
    'active',
    'is_active',
    'include',
  ])

  if (!base || !authKey) {
    return NextResponse.json({ items: [] }, { status: 200 })
  }

  const apiUrl = new URL(`${base.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}`)
  // Select all columns to be schema-agnostic; filter to active rows
  apiUrl.searchParams.set('select', '*')
  apiUrl.searchParams.set('active', 'is.true')
  apiUrl.searchParams.set('limit', String(limit))
  apiUrl.searchParams.set('order', 'name.asc')

  // Do not filter by tag at the DB level; we'll filter in-memory for robustness across schemas

  const res = await fetch(apiUrl.toString(), {
    headers: {
      apikey: authKey,
      Authorization: `Bearer ${authKey}`,
      Accept: 'application/json',
    },
    next: { revalidate },
  })
  let initialStatus = res.status
  let rows = res.ok ? ((await res.json()) as Array<Record<string, unknown>>) : []
  // Supabase PostgREST caps at 1000 rows per request by default. Page through in 1000-size chunks.
  const PAGE_SIZE = 1000
  if (res.ok && rows.length === PAGE_SIZE) {
    let offset = PAGE_SIZE
    while (true) {
      const pageUrl = new URL(apiUrl.toString())
      pageUrl.searchParams.set('limit', String(PAGE_SIZE))
      pageUrl.searchParams.set('offset', String(offset))
      const pageRes = await fetch(pageUrl.toString(), {
        headers: {
          apikey: authKey,
          Authorization: `Bearer ${authKey}`,
          Accept: 'application/json',
        },
        next: { revalidate },
      })
      if (!pageRes.ok) break
      const batch = (await pageRes.json()) as Array<Record<string, unknown>>
      rows = rows.concat(batch)
      if (batch.length < PAGE_SIZE) break
      offset += PAGE_SIZE
      // safety cap to avoid accidental infinite loops
      if (offset > 10000) break
    }
  }
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
  const toPublicLogo = (val: unknown): string => {
    const raw = typeof val === 'string' ? val : ''
    if (!raw) return ''
    if (/^https?:\/\//i.test(raw)) return raw
    if (!base) return ''
    if (raw.startsWith('/')) return `${base.replace(/\/$/, '')}${raw}`
    if (bucket) return `${base.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${raw.replace(/^\/+/, '')}`
    return ''
  }

  const pickFirst = (row: Record<string, unknown>, cols: string[]): string => {
    for (const c of cols) {
      const v = row[c]
      if (typeof v === 'string' && v.trim()) return v
    }
    return ''
  }

  const pickTags = (row: Record<string, unknown>): string[] => {
    for (const c of tagCols) {
      const t = toArrayTags(row[c])
      if (t.length) return t
    }
    return []
  }

  const pickActive = (row: Record<string, unknown>): boolean | undefined => {
    for (const c of activeCols) {
      const v = row[c]
      if (typeof v === 'boolean') return v
      if (typeof v === 'number') return v !== 0
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        if (['true', 't', '1', 'yes', 'y', 'checked'].includes(s)) return true
        if (['false', 'f', '0', 'no', 'n', 'unchecked'].includes(s)) return false
      }
    }
    return undefined
  }

  const rawRowCount = rows.length
  let items = rows
    .map((row) => {
      const nameCandidate = pickFirst(row, nameCols) || pickFirst(row, ['company_name', 'company'])
      const logoCandidate = pickFirst(row, logoCols)
      const websiteRaw = pickFirst(row, websiteCols)
      const website = sanitizeWebsite(websiteRaw)
      const logo = toPublicLogo(logoCandidate) || logoFromWebsite(website)
      const name = nameCandidate || (website ? humanizeFromHostname(website) : '')
      return {
        id: row[idCol] as string | number | undefined,
        name,
        logo,
        website,
        tags: pickTags(row),
        active: pickActive(row),
      }
    })
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))
  const mappedCount = items.length

  // Fallback: broad fetch and heuristic mapping if nothing found
  if (items.length === 0) {
    const apiUrl2 = new URL(`${base.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}`)
    apiUrl2.searchParams.set('select', '*')
    apiUrl2.searchParams.set('active', 'is.true')
    apiUrl2.searchParams.set('limit', '5000')
    const res2 = await fetch(apiUrl2.toString(), {
      headers: {
        apikey: authKey,
        Authorization: `Bearer ${authKey}`,
        Accept: 'application/json',
      },
      next: { revalidate },
    })
    if (res2.ok) {
      const rows2 = (await res2.json()) as Array<Record<string, unknown>>
      const sample = rows2[0] || null
      const guessByKey = (row: Record<string, unknown>, includes: RegExp): string => {
        for (const [k, v] of Object.entries(row)) {
          if (!includes.test(k)) continue
          if (typeof v === 'string' && v.trim()) return v
        }
        return ''
      }
      const guessWebsite = (row: Record<string, unknown>): string => {
        for (const [k, v] of Object.entries(row)) {
          if (!/(website|url|homepage)/i.test(k)) continue
          if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v
        }
        return ''
      }
      const guessLogo = (row: Record<string, unknown>): string => {
        // Prefer explicit logo-like keys
        let candidate = guessByKey(row, /logo|image|icon/i)
        if (candidate) {
          const pub = toPublicLogo(candidate)
          if (pub) return pub
        }
        // Otherwise scan any string-ish value for an image-like URL
        for (const v of Object.values(row)) {
          if (typeof v !== 'string') continue
          const s = v.trim()
          if (!s) continue
          if (/^https?:\/\/.+\.(svg|png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(s)) return s
          if (s.startsWith('/storage/') || s.startsWith('storage/')) return toPublicLogo(s)
        }
        return ''
      }

      items = rows2
        .map((row) => {
          const name = pickFirst(row, nameCols) || guessByKey(row, /name|company/i)
          const website = pickFirst(row, websiteCols) || guessWebsite(row)
          const logo = guessLogo(row) || logoFromWebsite(website)
          return {
            id: row[idCol] as string | number | undefined,
            name,
            logo,
            website,
            tags: pickTags(row),
            active: pickActive(row),
          }
        })
        .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))

      if (wantDebug) {
        return NextResponse.json(
          { items, debug: { sampleKeys: sample ? Object.keys(sample) : [], selectUsed: '*', initialStatus } },
          { status: 200 },
        )
      }
    }
  }

  // In-memory tag filtering
  const isAll = !tag || ['all', 'top 200', 'top200', 'top-200'].includes(tag.toLowerCase())
  if (!isAll) {
    const t = tag.toLowerCase()
    items = items.filter((it) => (it.tags || []).some((x) => x.toLowerCase() === t))
  }
  const afterTagFilterCount = items.length

  // Only include active=true if the active field exists on any item; otherwise, leave list as-is
  const hasActiveField = items.some((it: any) => typeof it.active !== 'undefined')
  if (hasActiveField) {
    items = items.filter((it: any) => it.active === true)
  }
  const activeTrueCount = items.length
  const withLogoCount = items.filter((it) => Boolean((it as any).logo)).length

  // Final guaranteed sort by name (ignoring leading articles)
  items = items.sort((a, b) => sortKey((a as any).name).localeCompare(sortKey((b as any).name)))

  return NextResponse.json(
    { items, debug: wantDebug ? { rawRowCount, mappedCount, afterTagFilterCount, activeTrueCount, withLogoCount, initialStatus } : undefined },
    { status: 200 },
  )
}
