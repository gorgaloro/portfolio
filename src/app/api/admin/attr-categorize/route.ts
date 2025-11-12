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
      max_tokens: 1200,
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

const fitAllowed = new Set(['Industry Fit','Process Fit','Technical Fit'])
function normalizeFitCategory(s: string): 'Industry Fit'|'Process Fit'|'Technical Fit' {
  const v = String(s || '').toLowerCase()
  if (v.includes('industry')) return 'Industry Fit'
  if (v.includes('process') || v.includes('method')) return 'Process Fit'
  return 'Technical Fit'
}

async function runForDeal(dealId: number) {
  const supabase = getClient()
  const prior = await supabase
    .from('jd_attribute_ranking')
    .select('deal_id, job_title, jd_hash, rank, attribute, category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (prior.error) return NextResponse.json({ error: prior.error.message }, { status: 500 })
  const items = prior.data || []
  if (items.length === 0) return NextResponse.json({ error: 'No Prompt 1 results found. Run /api/admin/attr-ranking first.' }, { status: 400 })

  const job_title = items[0]?.job_title || ''
  const jd_hash = items[0]?.jd_hash || null

  const system = [
    'You are a senior professional recruiter with over 30 years of experience across multiple industries.',
    'Classify each job attribute into a primary fit category: "Industry Fit", "Process Fit", or "Technical Fit".',
    'Preserve the original rank and attribute. Include a short recruiter-style rationale.',
    'Return STRICT JSON array only.'
  ].join(' ')

  const inputList = items.map((r: any) => ({ rank: r.rank, attribute: r.attribute, category: r.category }))
  const user = `Input attributes (from Prompt 1):\n${JSON.stringify(inputList, null, 2)}\n\nOutput an array of objects with keys: rank, attribute, previous_category, fit_category, rationale. Return ONLY valid JSON.`

  const ai = await callOpenAI(system, user)
  const arr = Array.isArray(ai.data) ? ai.data : []
  const top = arr.filter((x: any) => Number.isFinite(+x.rank) && x.attribute)

  await supabase.from('jd_attribute_categories').delete().eq('deal_id', dealId)

  const rows = top.map((x: any) => ({
    deal_id: dealId,
    job_title,
    jd_hash,
    model: ai.model,
    model_version: ai.model,
    rank: Number(x.rank),
    attribute: String(x.attribute),
    previous_category: x.previous_category ? String(x.previous_category) : (x.category ? String(x.category) : null),
    fit_category: fitAllowed.has(String(x.fit_category)) ? String(x.fit_category) as 'Industry Fit'|'Process Fit'|'Technical Fit' : normalizeFitCategory(String(x.fit_category || '')),
    rationale: x.rationale ? String(x.rationale) : null,
  }))

  const cleanRows = rows
    .filter(r => r.rank >= 1 && r.rank <= 30 && r.attribute)

  if (cleanRows.length) await supabase.from('jd_attribute_categories').insert(cleanRows)

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
