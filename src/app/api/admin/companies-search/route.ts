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
    // Default to Job Application pipeline id unless overridden
    const pipelineId = (searchParams.get('pipelineId') || '1320210144').trim()
    // Find deals in the requested pipeline
    const dealsResp = await supabase
      .from('hubspot_deals')
      .select('deal_id')
      .eq('pipeline', pipelineId)
    if (dealsResp.error) return NextResponse.json({ error: dealsResp.error.message }, { status: 500 })
    const dealIds = (dealsResp.data || []).map((d: any) => d.deal_id)
    if (dealIds.length === 0) return NextResponse.json({ companies: [] })

    // Map to company IDs
    const mapResp = await supabase
      .from('hubspot_deal_companies')
      .select('company_id')
      .in('deal_id', dealIds)
    if (mapResp.error) return NextResponse.json({ error: mapResp.error.message }, { status: 500 })
    const companyIds = Array.from(new Set((mapResp.data || []).map((r: any) => r.company_id)))
    // Count jobs per company
    const counts = new Map<number, number>()
    for (const r of (mapResp.data || [])) counts.set(r.company_id, (counts.get(r.company_id) || 0) + 1)
    if (companyIds.length === 0) return NextResponse.json({ companies: [] })

    // Load companies
    const compResp = await supabase
      .from('hubspot_companies')
      .select('company_id, name, domain')
      .in('company_id', companyIds)
    if (compResp.error) return NextResponse.json({ error: compResp.error.message }, { status: 500 })
    let rows = (compResp.data || []).map((r: any) => ({ ...r, jobs_count: counts.get(r.company_id) || 0 }))
    if (q) rows = rows.filter((r: any) => (r.name || '').toLowerCase().includes(q.toLowerCase()) || (r.domain || '').toLowerCase().includes(q.toLowerCase()))
    rows.sort((a: any, b: any) => (b.jobs_count - a.jobs_count) || (a.name || '').localeCompare(b.name || ''))
    rows = rows.slice(0, limit)
    return NextResponse.json({ companies: rows })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
