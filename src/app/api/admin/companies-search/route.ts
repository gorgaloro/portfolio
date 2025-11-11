export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500)
    const supabase = getClient()
    const pat = q ? `%${q}%` : null

    let resp = await supabase
      .from('hubspot_deal_companies_view')
      .select('company_id, name, domain', { count: 'exact' })
      .order('name', { ascending: true })
      .limit(limit)

    if (resp.error) {
      let fallback = supabase.from('hubspot_companies').select('company_id, name, domain').order('name', { ascending: true }).limit(limit)
      if (q && pat) fallback = fallback.or(`name.ilike.${pat},domain.ilike.${pat}`)
      const fb = await fallback
      if (fb.error) return NextResponse.json({ error: fb.error.message }, { status: 500 })
      return NextResponse.json({ companies: fb.data || [] })
    }

    let rows = resp.data || []
    if (q && pat) rows = rows.filter((r: any) => (r.name || '').toLowerCase().includes(q.toLowerCase()) || (r.domain || '').toLowerCase().includes(q.toLowerCase()))
    const uniq = new Map<number, any>()
    for (const r of rows) if (!uniq.has(r.company_id)) uniq.set(r.company_id, r)
    return NextResponse.json({ companies: Array.from(uniq.values()) })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
