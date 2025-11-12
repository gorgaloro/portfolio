export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

async function callOpenAI(system: string, user: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${text}`)
  const json = JSON.parse(text)
  const content: string = json?.choices?.[0]?.message?.content?.trim() || ''
  const cleaned = content.replace(/^```(?:json)?\n?|\n?```$/g, '')
  return { raw: content, model: json?.model || 'gpt-4o-mini', data: JSON.parse(cleaned) }
}

async function runForDeal(dealId: number) {
  const supabase = getClient()

  const refined = await supabase
    .from('jd_attribute_refined')
    .select('deal_id, job_title, jd_hash, rank, refined_attribute')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (refined.error) return NextResponse.json({ error: refined.error.message }, { status: 500 })
  const items = refined.data || []
  if (items.length === 0) return NextResponse.json({ error: 'No Prompt 3 results found. Run /api/admin/attr-refine first.' }, { status: 400 })

  let job_title = items[0]?.job_title || ''
  let jd_hash = items[0]?.jd_hash || null as string | null

  if (!job_title) {
    const d = await supabase
      .from('hubspot_deals')
      .select('job_title')
      .eq('deal_id', dealId)
      .maybeSingle()
    if (!d.error) job_title = d.data?.job_title || ''
  }

  const system = [
    'You are a professional hiring manager with 25+ years of experience overseeing recruitment and team development across diverse industries.',
    'Pretend you are hiring for the given job title. Rank each refined attribute from 1–30 by generic role relevance.',
    'Ignore company-specific context; evaluate purely on job title relevance and professional judgment.',
    'Return STRICT JSON array only.'
  ].join(' ')

  const inputList = items.map((r: any) => ({ rank: r.rank, refined_attribute: r.refined_attribute }))
  const user = `Job title: ${job_title || ''}\nRefined attributes (from Prompt 3):\n${JSON.stringify(inputList, null, 2)}\n\nOutput an array of objects with keys: rank (1-30, 1 highest), refined_attribute, relevance_score (1-10), rationale (1-2 sentences). Return ONLY valid JSON.`

  const ai = await callOpenAI(system, user)
  const arr = Array.isArray(ai.data) ? ai.data : []
  const top = arr.filter((x: any) => Number.isFinite(+x.rank) && x.refined_attribute && Number.isFinite(+x.relevance_score))

  await supabase.from('jd_attribute_role_relevance').delete().eq('deal_id', dealId)

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const rows = top.map((x: any) => ({
    deal_id: dealId,
    job_title,
    jd_hash,
    model: ai.model,
    model_version: ai.model,
    rank: clamp(Math.round(Number(x.rank)), 1, 30),
    refined_attribute: String(x.refined_attribute),
    relevance_score: clamp(Number(x.relevance_score), 1, 10),
    rationale: x.rationale ? String(x.rationale) : null,
  }))

  const cleanRows = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.refined_attribute && Number.isFinite(r.relevance_score as any))
  if (cleanRows.length) await (supabase.from('jd_attribute_role_relevance') as any).insert(cleanRows as any[])

  return NextResponse.json({ ok: true, deal_id: dealId, count: cleanRows.length })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const dealId = Number(url.searchParams.get('dealId'))
    if (!Number.isFinite(dealId)) return NextResponse.json({ error: 'dealId required' }, { status: 400 })
    return runForDeal(dealId)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { dealId?: number }
    const dealId = Number(body.dealId)
    if (!Number.isFinite(dealId)) return NextResponse.json({ error: 'dealId required' }, { status: 400 })
    return runForDeal(dealId)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
