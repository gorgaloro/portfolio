export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = Number(searchParams.get('companyId') || '0')
    const pipeline = searchParams.get('pipeline') || 'Job Applications'
    if (!companyId) return NextResponse.json({ deals: [] })

    const supabase = getClient()
    const links = await supabase.from('hubspot_deal_companies').select('deal_id').eq('company_id', companyId)
    if (links.error) return NextResponse.json({ error: links.error.message }, { status: 500 })
    const ids = (links.data || []).map((r: any) => r.deal_id)
    if (!ids.length) return NextResponse.json({ deals: [] })

    const dealsResp = await supabase
      .from('hubspot_deals')
      .select('deal_id, dealname, job_title, job_url, pipeline, hs_lastmodifieddate')
      .in('deal_id', ids)
      .eq('pipeline', pipeline)
      .order('hs_lastmodifieddate', { ascending: false })
    if (dealsResp.error) return NextResponse.json({ error: dealsResp.error.message }, { status: 500 })
    const deals = dealsResp.data || []
    if (!deals.length) return NextResponse.json({ deals: [] })

    const dealIds = deals.map((d: any) => d.deal_id)

    const summaries = await supabase
      .from('job_fit_summary')
      .select('deal_id, total_fit_percent, industry_fit_percent, process_fit_percent, technical_fit_percent, narrative')
      .in('deal_id', dealIds)
    const attrs = await supabase
      .from('job_fit_attributes')
      .select('deal_id, attribute_name, category, fit_color, final_rank')
      .in('deal_id', dealIds)

    const sMap = new Map<number, any>()
    for (const s of summaries.data || []) sMap.set(s.deal_id, s)
    const aMap = new Map<number, any[]>()
    for (const a of attrs.data || []) {
      const arr = aMap.get(a.deal_id) || []
      arr.push(a)
      aMap.set(a.deal_id, arr)
    }

    const result = deals.map((d: any) => ({
      deal_id: d.deal_id,
      job_title: d.job_title || d.dealname,
      job_url: d.job_url || null,
      pipeline: d.pipeline,
      summary: sMap.get(d.deal_id) || null,
      attributes: (aMap.get(d.deal_id) || []).sort((x, y) => x.final_rank - y.final_rank)
    }))

    return NextResponse.json({ deals: result })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
