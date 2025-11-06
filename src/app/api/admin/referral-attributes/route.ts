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

async function getHashes(supabase: any, dealId: number) {
  const r = await supabase.from('job_fit_summary').select('jd_hash, profile_hash').eq('deal_id', dealId).maybeSingle()
  if (r.error) throw r.error
  if (!r.data) throw new Error('No summary for deal')
  return r.data as { jd_hash: string, profile_hash: string }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dealId = Number(searchParams.get('dealId') || '0')
    if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

    const supabase = getClient()
    const hashes = await getHashes(supabase, dealId)
    const summaryResp = await supabase
      .from('job_fit_summary')
      .select('deal_id, total_fit_percent, industry_fit_percent, process_fit_percent, technical_fit_percent, narrative, jd_hash, profile_hash, analyzed_at')
      .eq('deal_id', dealId)
      .maybeSingle()

    const attrs = await supabase
      .from('job_fit_attributes')
      .select('attribute_name, category, fit_color, final_rank')
      .eq('deal_id', dealId)
      .order('final_rank', { ascending: true })

    if (attrs.error) return NextResponse.json({ error: attrs.error.message }, { status: 500 })

    const overrides = await supabase
      .from('job_fit_overrides')
      .select('attribute_name, label, pillar, color, visible')
      .eq('deal_id', dealId)
      .eq('jd_hash', hashes.jd_hash)
      .eq('profile_hash', hashes.profile_hash)

    const oMap = new Map<string, any>()
    for (const o of overrides.data || []) oMap.set(o.attribute_name, o)

    const rows = (attrs.data || []).map((a: any) => {
      const o = oMap.get(a.attribute_name)
      return {
        deal_id: dealId,
        attribute_name: a.attribute_name,
        label: o?.label ?? a.attribute_name,
        category: a.category,
        pillar: o?.pillar ?? a.category,
        fit_color: a.fit_color,
        color: o?.color ?? a.fit_color,
        visible: o?.visible ?? true,
        final_rank: a.final_rank,
        has_override: !!o,
      }
    })

    return NextResponse.json({
      deal_id: dealId,
      jd_hash: hashes.jd_hash,
      profile_hash: hashes.profile_hash,
      summary: summaryResp.data || null,
      attributes: rows
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      dealId?: number
      attribute_name?: string
      updates?: { label?: string | null, pillar?: 'industry'|'process'|'technical'|null, color?: 'green'|'yellow'|'grey'|null, visible?: boolean|null }
      reset?: boolean
    }
    const dealId = Number(body.dealId || 0)
    if (!dealId || !body.attribute_name) return NextResponse.json({ error: 'dealId and attribute_name required' }, { status: 400 })

    const supabase = getClient()
    const hashes = await getHashes(supabase, dealId)

    if (body.reset) {
      const del = await supabase
        .from('job_fit_overrides')
        .delete()
        .eq('deal_id', dealId)
        .eq('attribute_name', body.attribute_name)
        .eq('jd_hash', hashes.jd_hash)
        .eq('profile_hash', hashes.profile_hash)
      if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })
      return NextResponse.json({ ok: true, status: 'reset' })
    }

    const upd = body.updates || {}
    const row = {
      deal_id: dealId,
      attribute_name: body.attribute_name,
      jd_hash: hashes.jd_hash,
      profile_hash: hashes.profile_hash,
      label: upd.label ?? null,
      pillar: upd.pillar ?? null,
      color: upd.color ?? null,
      visible: typeof upd.visible === 'boolean' ? upd.visible : null,
    }

    const ins = await supabase.from('job_fit_overrides').upsert(row, { onConflict: 'deal_id,attribute_name,jd_hash,profile_hash' })
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })

    return NextResponse.json({ ok: true, status: 'saved' })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
