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

function paretoWeight(rank: number) {
  const w = 100 * Math.pow(0.6, Math.max(0, (rank || 1) - 1))
  return Math.max(1, Math.round(w))
}
function multForColor(c: string): number { if (c === 'green') return 1; if (c === 'yellow') return 0.65; return 0 }

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
const fitAllowed = new Set(['Industry Fit','Process Fit','Technical Fit'])
function normalizeFitCategory(s: string): 'Industry Fit'|'Process Fit'|'Technical Fit' {
  const v = String(s || '').toLowerCase()
  if (v.includes('industry')) return 'Industry Fit'
  if (v.includes('process') || v.includes('method')) return 'Process Fit'
  return 'Technical Fit'
}

async function runPrompt2Categorization(supabase: any, dealId: number) {
  const prior = await supabase
    .from('jd_attribute_ranking')
    .select('deal_id, job_title, jd_hash, rank, attribute, category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (prior.error) throw new Error(prior.error.message)
  const items: any[] = (prior.data as any[]) || []
  if (items.length === 0) return { categorized: 0 }

  const job_title = items[0]?.job_title || ''
  const jd_hash = items[0]?.jd_hash || null

  const system = [
    'You are a senior professional recruiter with over 30 years of experience across multiple industries, specializing in hiring for technology, operations, and enterprise leadership roles.',
    'Classify each job attribute into a primary fit category: "Industry Fit" (domain or sector), "Process Fit" (operational or methodological), or "Technical Fit" (skills, tools, systems, data).',
    'Preserve the original rank and attribute and include the previous category from input as previous_category.',
    'Include a short recruiter-style rationale for each. Return STRICT JSON array only.'
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

  const cleanRows: any[] = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.attribute)
  if (cleanRows.length) await (supabase.from('jd_attribute_categories') as any).insert(cleanRows as any[])
  return { categorized: cleanRows.length }
}

async function runPrompt3Refinement(supabase: any, dealId: number) {
  const cat = await supabase
    .from('jd_attribute_categories')
    .select('deal_id, job_title, jd_hash, rank, attribute, fit_category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (cat.error) throw new Error(cat.error.message)
  const items: any[] = (cat.data as any[]) || []
  if (items.length === 0) return { refined: 0 }

  const job_title = items[0]?.job_title || ''
  let jd_hash: string | null = items[0]?.jd_hash || null

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
  if (!job_description || job_description.trim().length < 40) return { refined: 0, skipped: 'no jd' }

  const system = [
    'You are a senior recruiter and hiring manager with 30 years of experience reviewing resumes and job descriptions across enterprise, SaaS, and technology organizations.',
    'Refine each attribute into a professional, human-readable phrase (max 5 words) using the job context to resolve ambiguity.',
    'Preserve metadata: rank and category. Return STRICT JSON array only.'
  ].join(' ')

  const inputList = items.map((r: any) => ({ rank: r.rank, attribute: r.attribute, fit_category: r.fit_category }))
  const user = `Job title: ${job_title || ''}\nJob description:\n${job_description}\n\nAttributes (from Prompt 2):\n${JSON.stringify(inputList, null, 2)}\n\nOutput an array of objects with keys: rank, original_attribute, refined_attribute, fit_category, rationale. Each refined_attribute must be <= 5 words. Return ONLY valid JSON.`

  const ai = await callOpenAI(system, user)
  const arr = Array.isArray(ai.data) ? ai.data : []
  const top = arr.filter((x: any) => Number.isFinite(+x.rank) && (x.original_attribute || x.attribute) && x.refined_attribute)

  await supabase.from('jd_attribute_refined').delete().eq('deal_id', dealId)

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
    fit_category: String(x.fit_category),
    rationale: x.rationale ? String(x.rationale) : null,
  }))

  const cleanRows: any[] = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.original_attribute && r.refined_attribute)
  if (cleanRows.length) await (supabase.from('jd_attribute_refined') as any).insert(cleanRows as any[])
  return { refined: cleanRows.length }
}

async function runPrompt4Relevance(supabase: any, dealId: number) {
  const refined = await supabase
    .from('jd_attribute_refined')
    .select('deal_id, job_title, jd_hash, rank, refined_attribute')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (refined.error) throw new Error(refined.error.message)
  const items: any[] = (refined.data as any[]) || []
  if (items.length === 0) return { role_ranked: 0 }

  let job_title: string = items[0]?.job_title || ''
  const jd_hash: string | null = items[0]?.jd_hash || null

  if (!job_title) {
    const d = await supabase
      .from('hubspot_deals')
      .select('job_title')
      .eq('deal_id', dealId)
      .maybeSingle()
    const dData: any = (d as any).data || {}
    if (!d.error) job_title = dData.job_title || ''
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
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const top = arr.filter((x: any) => Number.isFinite(+x.rank) && x.refined_attribute && Number.isFinite(+x.relevance_score))

  await supabase.from('jd_attribute_role_relevance').delete().eq('deal_id', dealId)

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

  const cleanRows: any[] = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.refined_attribute && Number.isFinite(r.relevance_score as any))
  if (cleanRows.length) await (supabase.from('jd_attribute_role_relevance') as any).insert(cleanRows as any[])
  return { role_ranked: cleanRows.length }
}

async function mapPromptsToJobFitAttributes(supabase: any, dealId: number) {
  // Load refined (Prompt 3) and role relevance (Prompt 4)
  const refined = await supabase
    .from('jd_attribute_refined')
    .select('rank, refined_attribute, fit_category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (refined.error) throw new Error(refined.error.message)
  const refItems: any[] = (refined.data as any[]) || []

  const role = await supabase
    .from('jd_attribute_role_relevance')
    .select('rank, refined_attribute')
    .eq('deal_id', dealId)
  if (role.error) throw new Error(role.error.message)
  const roleItems: any[] = (role.data as any[]) || []

  const titleRankByLabel = new Map<string, number>()
  for (const r of roleItems) titleRankByLabel.set(String(r.refined_attribute).toLowerCase(), Number(r.rank))

  // Build items with jd_rank from refined.rank and title_rank from role relevance by matching label
  const tmp: Array<{ label: string, pillar: 'industry'|'process'|'technical', jd_rank: number, title_rank: number }> = []
  for (const it of refItems) {
    const label = String(it.refined_attribute || '').trim()
    if (!label) continue
    const key = label.toLowerCase()
    const jd_rank = Number(it.rank)
    const fitCat = String(it.fit_category || '').toLowerCase()
    const pillar: 'industry'|'process'|'technical' = fitCat.includes('industry') ? 'industry' : (fitCat.includes('process') ? 'process' : 'technical')
    const title_rank = Number(titleRankByLabel.get(key) || jd_rank)
    tmp.push({ label, pillar, jd_rank, title_rank })
  }

  // Sort primarily by title_rank, then jd_rank, and assign sequential final_rank
  tmp.sort((a, b) => (a.title_rank - b.title_rank) || (a.jd_rank - b.jd_rank) || a.label.localeCompare(b.label))
  const finalList = tmp.map((t, i) => ({ ...t, final_rank: i + 1 }))

  // Persist to job_fit_attributes
  await supabase.from('job_fit_attributes').delete().eq('deal_id', dealId)
  const rows = finalList.map((t) => {
    const weight = paretoWeight(t.final_rank)
    const fit_color: 'green'|'yellow'|'grey' = 'grey'
    const fit_multiplier = multForColor(fit_color)
    const weighted_score = Math.round(weight * fit_multiplier)
    return {
      deal_id: dealId,
      attribute_name: t.label,
      category: t.pillar,
      jd_rank: t.jd_rank,
      title_rank: t.title_rank,
      final_rank: t.final_rank,
      weight,
      fit_color,
      fit_multiplier,
      weighted_score,
    }
  })
  if (rows.length) await (supabase.from('job_fit_attributes') as any).insert(rows as any[])
  return { attributes_upserted: rows.length }
}

async function processDeal(dealId: number) {
  const supabase = getClient()
  const deal = await supabase
    .from('hubspot_deals')
    .select('deal_id, job_title, submission_notes')
    .eq('deal_id', dealId)
    .maybeSingle()
  const dealData: any = (deal as any).data || {}
  if (deal.error || !dealData) return { deal_id: dealId, error: deal.error?.message || 'Deal not found' }

  const js = await supabase
    .from('job_fit_summary')
    .select('jd_text')
    .eq('deal_id', dealId)
    .maybeSingle()
  const jsData: any = (js as any).data || {}

  const job_title = dealData.job_title || ''
  const job_description = (jsData.jd_text || dealData.submission_notes || '').toString()
  if (!job_description || job_description.trim().length < 40) return { deal_id: dealId, job_title, status: 'skipped', reason: 'job_description_missing' }

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

  await supabase.from('jd_attribute_ranking').delete().eq('deal_id', dealId)
  const rankRows = top.map((x: any) => ({
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
  if (rankRows.length) await (supabase.from('jd_attribute_ranking') as any).insert(rankRows as any[])

  let p2 = { categorized: 0 } as any
  try { p2 = await runPrompt2Categorization(supabase, dealId) } catch (e: any) { p2 = { categorized: 0, error: String(e?.message ?? e) } }
  if (!p2 || Number(p2.categorized || 0) <= 0) {
    return { deal_id: dealId, job_title, status: 'skipped', reason: 'prompt2_empty', prompt1: rankRows.length, prompt2: p2 }
  }

  let p3 = { refined: 0 } as any
  try { p3 = await runPrompt3Refinement(supabase, dealId) } catch (e: any) { p3 = { refined: 0, error: String(e?.message ?? e) } }
  if (!p3 || Number(p3.refined || 0) <= 0) {
    return { deal_id: dealId, job_title, status: 'skipped', reason: 'no_refined_attributes', prompt1: rankRows.length, prompt2: p2, prompt3: p3 }
  }

  let p4 = { role_ranked: 0 } as any
  try { p4 = await runPrompt4Relevance(supabase, dealId) } catch (e: any) { p4 = { role_ranked: 0, error: String(e?.message ?? e) } }
  let mapped = { attributes_upserted: 0 } as any
  try { mapped = await mapPromptsToJobFitAttributes(supabase, dealId) } catch (e: any) { mapped = { attributes_upserted: 0, error: String(e?.message ?? e) } }
  if (!mapped || Number(mapped.attributes_upserted || 0) <= 0) {
    return { deal_id: dealId, job_title, status: 'skipped', reason: 'no_attributes_mapped', prompt1: rankRows.length, prompt2: p2, prompt3: p3, prompt4: p4, mapped }
  }

  return { deal_id: dealId, job_title, status: 'ok', prompt1: rankRows.length, prompt2: p2, prompt3: p3, prompt4: p4, mapped }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get('dealIds') || ''
    const dealIds = idsParam.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n))
    if (dealIds.length === 0) return NextResponse.json({ error: 'dealIds required, comma-separated' }, { status: 400 })

    const results = [] as any[]
    for (const id of dealIds) {
      results.push(await processDeal(id))
    }

    return NextResponse.json({ ok: true, processed: results })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { dealIds?: number[] | string }
    let dealIds: number[] = []
    if (Array.isArray(body.dealIds)) dealIds = body.dealIds.map(n => Number(n)).filter(n => Number.isFinite(n))
    else if (typeof body.dealIds === 'string') dealIds = body.dealIds.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n))
    if (dealIds.length === 0) return NextResponse.json({ error: 'dealIds required' }, { status: 400 })

    const results = [] as any[]
    for (const id of dealIds) {
      results.push(await processDeal(id))
    }

    return NextResponse.json({ ok: true, processed: results })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
