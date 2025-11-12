export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

function sha256Hex(s: string) {
  return crypto.createHash('sha256').update(String(s || ''), 'utf8').digest('hex')
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

const allowedCategories = new Set(['Skill','Tool','Experience','Trait','Qualification','Knowledge Area'])

async function runForDeal(dealId: number) {
  const supabase = getClient()
  const deal = await supabase
    .from('hubspot_deals')
    .select('deal_id, job_title, submission_notes')
    .eq('deal_id', dealId)
    .maybeSingle()
  if (deal.error || !deal.data) return NextResponse.json({ error: deal.error?.message || 'Deal not found' }, { status: 404 })

  const js = await supabase
    .from('job_fit_summary')
    .select('jd_text')
    .eq('deal_id', dealId)
    .maybeSingle()

  const job_title = deal.data.job_title || ''
  const job_description = (js.data?.jd_text || deal.data.submission_notes || '').toString()
  if (!job_description || job_description.trim().length < 40) return NextResponse.json({ error: 'No job description text available' }, { status: 400 })

  const system = [
    'You are an experienced technical recruiter and hiring manager specializing in mid-to-senior roles.',
    'Read a job description and extract the 30 most important attributes or keywords that define what the employer is seeking.',
    'Treat attributes broadly — skills, tools, methodologies, qualifications, traits, or experiences.',
    'Rank each attribute 1–30 by relative importance where 1 is most essential.',
    'Base your ranking on frequency/emphasis, core to success, and industry norms.',
    'Output a JSON array of objects with keys: rank, attribute, category, rationale.',
    'Categories must be one of: Skill, Tool, Experience, Trait, Qualification, Knowledge Area.',
    'Ensure uniqueness and concise natural phrasing.'
  ].join(' ')

  const user = JSON.stringify({ job_title, job_description })

  const ai = await callOpenAI(system, user)
  const arr = Array.isArray(ai.data) ? ai.data : []
  const top = arr
    .filter((x: any) => x && Number.isFinite(+x.rank) && x.attribute)
    .slice(0, 30)

  const jd_hash = sha256Hex(job_description)

  const rows = top.map((x: any) => ({
    deal_id: dealId,
    job_title,
    jd_hash,
    model: ai.model,
    model_version: ai.model,
    rank: Number(x.rank),
    attribute: String(x.attribute),
    category: allowedCategories.has(String(x.category)) ? String(x.category) : 'Skill',
    rationale: x.rationale ? String(x.rationale) : null
  }))

  await supabase.from('jd_attribute_ranking').delete().eq('deal_id', dealId)
  if (rows.length) await supabase.from('jd_attribute_ranking').insert(rows)

  return NextResponse.json({ ok: true, deal_id: dealId, count: rows.length })
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
