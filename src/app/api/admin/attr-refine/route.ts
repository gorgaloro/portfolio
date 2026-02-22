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

  const cat = await supabase
    .from('jd_attribute_categories')
    .select('deal_id, job_title, jd_hash, rank, attribute, fit_category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (cat.error) return NextResponse.json({ error: cat.error.message }, { status: 500 })
  const items = cat.data || []
  if (items.length === 0) return NextResponse.json({ error: 'No Prompt 2 results found. Run /api/admin/attr-categorize first.' }, { status: 400 })

  const job_title = items[0]?.job_title || ''
  let jd_hash = items[0]?.jd_hash || null as string | null
  const fitByRank = new Map<number, string>(items.map((r: any) => [Number(r.rank), String(r.fit_category)]))

  const fit = await supabase
    .from('job_fit_summary')
    .select('jd_text, jd_hash')
    .eq('deal_id', dealId)
    .maybeSingle()

  const deals = await supabase
    .from('hubspot_deals')
    .select('job_title, submission_notes')
    .eq('deal_id', dealId)
    .maybeSingle()

  const fitData: any = (fit as any).data || {}
  const dealsData: any = (deals as any).data || {}
  const job_description = (fitData.jd_text || dealsData.submission_notes || '').toString()
  if (!jd_hash) jd_hash = fitData.jd_hash || null
  if (!job_description || job_description.trim().length < 40) {
    return NextResponse.json({ error: 'No job description text available' }, { status: 400 })
  }

  const system = [
    'You are a senior recruiter and hiring manager with 30 years of experience reviewing resumes and job descriptions across enterprise, SaaS, and technology organizations.',
    'Refine each attribute into a professional, human-readable phrase (max 5 words) using the job context to resolve ambiguity.',
    'Preserve metadata: rank and category. Return STRICT JSON array only.'
  ].join(' ')

  const inputList = items.map((r: any) => ({ rank: r.rank, attribute: r.attribute, fit_category: r.fit_category }))
  const user = `Job title: ${job_title || ''}\nJob description:\n${job_description}\n\nAttributes (from Prompt 2):\n${JSON.stringify(inputList, null, 2)}\n\nOutput an array of objects with keys: rank, original_attribute, refined_attribute, fit_category, rationale. Each refined_attribute must be <= 5 words. Return ONLY valid JSON.`

  const ai = await callOpenAI(system, user)
  const arr = Array.isArray(ai.data) ? ai.data : []
  const top = arr.filter((x: any) => Number.isFinite(+x.rank) && x.original_attribute && x.refined_attribute)

  await supabase.from('jd_attribute_refined').delete().eq('deal_id', dealId)

  const fitAllowed = new Set(['Industry Fit','Process Fit','Technical Fit'])
  function normalizeFitCategory(s: string): 'Industry Fit'|'Process Fit'|'Technical Fit' {
    const v = String(s || '').toLowerCase()
    if (v.includes('industry')) return 'Industry Fit'
    if (v.includes('process') || v.includes('method')) return 'Process Fit'
    return 'Technical Fit'
  }
  function limitWords(s: string, maxWords = 5): string {
    const words = String(s || '').trim().split(/\s+/)
    return words.slice(0, maxWords).join(' ')
  }

  const rows = top.map((x: any) => ({
    deal_id: dealId,
    job_title,
    jd_hash,
    model: ai.model,
    model_version: ai.model,
    rank: Number(x.rank),
    original_attribute: String(x.original_attribute || x.attribute),
    refined_attribute: limitWords(String(x.refined_attribute)),
    fit_category: ((): 'Industry Fit'|'Process Fit'|'Technical Fit' => {
      const fromPrompt2 = fitByRank.get(Number(x.rank))
      if (fromPrompt2 && fitAllowed.has(fromPrompt2)) return fromPrompt2 as any
      return normalizeFitCategory(String(x.fit_category || fromPrompt2 || ''))
    })(),
    rationale: x.rationale ? String(x.rationale) : null,
  }))

  const cleanRows = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.original_attribute && r.refined_attribute)
  if (cleanRows.length) await (supabase.from('jd_attribute_refined') as any).insert(cleanRows as any[])

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
