export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { jsonrepair } from 'jsonrepair'

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


type CallAIOptions = { allowParseFailure?: boolean }

type Prompt2AttemptLog = { attempt: number, parse_error?: string | null, raw_preview?: string | null, output_invalid?: boolean }

type KeywordBuckets = { industry?: string[]; process?: string[]; technical?: string[] }

type SummaryPayload = {
  jd_summary: string | null
  fit_summary: string | null
  keywords: KeywordBuckets
  fit_score: number | null
}

function clipSnippet(raw?: string | null, limit = 800) {
  if (!raw) return null
  return raw.length > limit ? `${raw.slice(0, limit)}…` : raw
}

function pillarFromFitCategoryLabel(s: string | null | undefined): 'industry'|'process'|'technical' {
  const v = String(s || '').toLowerCase()
  if (v.includes('industry') || v.includes('market') || v.includes('sector')) return 'industry'
  if (v.includes('process') || v.includes('method') || v.includes('ops')) return 'process'
  return 'technical'
}

function pillarFromPrompt1Category(s: string | null | undefined): 'industry'|'process'|'technical' {
  const v = String(s || '').toLowerCase()
  if (v.includes('knowledge') || v.includes('industry')) return 'industry'
  if (v.includes('experience') || v.includes('trait') || v.includes('qualification')) return 'process'
  return 'technical'
}

function normalizeFitCategory(s: string): 'Industry Fit'|'Process Fit'|'Technical Fit' {
  const v = String(s || '').toLowerCase()
  if (v.includes('industry')) return 'Industry Fit'
  if (v.includes('process') || v.includes('method')) return 'Process Fit'
  return 'Technical Fit'
}


function buildFallbackAttributesFromPrompt1(rankRows: any[]) {
  const seen = new Set<string>()
  const clean = (rankRows || [])
    .map((r: any) => ({
      label: String(r.attribute ?? r.attribute_name ?? '').trim(),
      rank: Number(r.rank ?? r.jd_rank ?? 0),
      category: String(r.category ?? r.attribute_category ?? ''),
    }))
    .filter((r) => r.label && Number.isFinite(r.rank))
    .sort((a, b) => (a.rank - b.rank))

  const rows: Array<{
    attribute_name: string
    category: 'industry'|'process'|'technical'
    jd_rank: number
    title_rank: number
    final_rank: number
    weight: number
    fit_color: 'green'|'yellow'|'grey'
    fit_multiplier: number
    weighted_score: number
  }> = []

  for (const item of clean) {
    const key = item.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const final_rank = rows.length + 1
    const pillar = pillarFromPrompt1Category(item.category)
    const weight = paretoWeight(final_rank)
    const fit_color: 'green'|'yellow'|'grey' = 'grey'
    const fit_multiplier = multForColor(fit_color)
    rows.push({
      attribute_name: item.label,
      category: pillar,
      jd_rank: item.rank,
      title_rank: item.rank,
      final_rank,
      weight,
      fit_color,
      fit_multiplier,
      weighted_score: Math.round(weight * fit_multiplier),
    })
    if (rows.length >= 30) break
  }

  return rows
}

async function applyFallbackAttributesFromPrompt1(supabase: any, dealId: number, rankRows: any[]) {
  const fallbackRows = buildFallbackAttributesFromPrompt1(rankRows)
  await supabase.from('job_fit_attributes').delete().eq('deal_id', dealId)
  if (fallbackRows.length) {
    await (supabase.from('job_fit_attributes') as any).insert(fallbackRows as any[])
  }
  return { attributes_upserted: fallbackRows.length, attributes: fallbackRows, source: 'prompt1_fallback' }
}

async function callOpenAI(system: string, user: string, opts: CallAIOptions = {}) {
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
  let data: any = null
  let parseError: string | null = null
  try {
    data = JSON.parse(cleaned)
  } catch (err) {
    parseError = err instanceof Error ? err.message : String(err)
    if (!opts.allowParseFailure) {
      const repaired = jsonrepair(cleaned)
      data = JSON.parse(repaired)
    }
  }
  return { raw: content, model: json?.model || 'gpt-4o-mini', data, parse_error: parseError, usage: json?.usage || null }
}

const allowedCategories = new Set(['Skill','Tool','Experience','Trait','Qualification','Knowledge Area'])
const fitAllowed = new Set(['Industry Fit','Process Fit','Technical Fit'])

function htmlToText(html: string): string {
  try {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch { return html }
}

async function getResumeText(): Promise<string> {
  try {
    if (process.env.RESUME_TEXT && process.env.RESUME_TEXT.trim().length > 0) return process.env.RESUME_TEXT
    const url = process.env.RESUME_URL
    if (url) {
      try {
        const r = await fetch(url)
        if (r.ok) return htmlToText(await r.text())
      } catch {}
    }
    try {
      const p = path.join(process.cwd(), 'Allen-Walker-Resume.md')
      const t = await fs.readFile(p, 'utf8')
      if (t && t.trim().length > 0) return t
    } catch {}
    try {
      const r = await fetch('https://www.allenwalker.info/about')
      if (r.ok) return htmlToText(await r.text())
    } catch {}
  } catch {}
  return ''
}

function coerceSummaryPayload(input: any, fallbackText: string): SummaryPayload {
  const source = (input && typeof input === 'object') ? input : {}
  const trimmedFallback = typeof fallbackText === 'string' ? fallbackText.trim() : ''
  const pickString = (...keys: string[]) => {
    for (const key of keys) {
      const value = source?.[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return null
  }
  const pickNumber = (...keys: string[]) => {
    for (const key of keys) {
      const value = source?.[key]
      if (typeof value === 'number' && Number.isFinite(value)) return value
    }
    return null
  }
  const keywordsRaw = source.keywords ?? {
    industry: source.industry_keywords ?? source.industry ?? [],
    process: source.process_keywords ?? source.process ?? [],
    technical: source.technical_keywords ?? source.technical ?? [],
  }

  const jd = pickString('jd_summary', 'jdSummary', 'job_summary', 'jobSummary', 'jobDescriptionSummary', 'jd', 'role_summary')
  const fit = pickString('fit_summary', 'fitSummary', 'fitNarrative', 'candidate_fit', 'summary_fit', 'fit')
  const keywords = normalizeKeywords(keywordsRaw)
  const score = pickNumber('fit_score', 'fitScore', 'score', 'fitRating')

  return {
    jd_summary: jd || trimmedFallback || null,
    fit_summary: fit || trimmedFallback || null,
    keywords,
    fit_score: typeof score === 'number' && Number.isFinite(score) ? score : null,
  }
}

async function callOpenAIJSON(prompt: { system: string, user: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ]
    })
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${text}`)
  const json = JSON.parse(text)
  const content: string = json?.choices?.[0]?.message?.content?.trim() || ''
  const cleaned = content.replace(/^```(?:json)?\n?|\n?```$/g, '')
  let parsed: any = null
  let parseError: string | null = null
  try {
    parsed = JSON.parse(cleaned)
  } catch (err: any) {
    parseError = err?.message || String(err)
    try {
      const repaired = jsonrepair(cleaned)
      parsed = JSON.parse(repaired)
    } catch (err2: any) {
      parseError = `${parseError}; repair_failed=${err2?.message || String(err2)}`
    }
  }

  if (parseError) {
    console.warn('[attr-orchestrate] callOpenAIJSON parse fallback', {
      parseError,
      preview: clipSnippet(content, 400),
    })
  }

  const normalized = coerceSummaryPayload(parsed, cleaned || content)

  return { data: normalized, usage: json?.usage, model: json?.model, raw: content }
}

function normalizeKeywords(obj: any): KeywordBuckets {
  const def: KeywordBuckets = { industry: [], process: [], technical: [] }
  if (!obj || typeof obj !== 'object') return def
  return {
    industry: Array.isArray(obj.industry) ? obj.industry : [],
    process: Array.isArray(obj.process) ? obj.process : [],
    technical: Array.isArray(obj.technical) ? obj.technical : [],
  }
}

type AttributeRow = {
  deal_id: number
  attribute_name: string
  category: 'industry'|'process'|'technical'
  jd_rank: number
  title_rank: number
  final_rank: number
  weight: number
  fit_color: 'green'|'yellow'|'grey'
  fit_multiplier: number
  weighted_score: number
}

function colorizeAttributes(rows: AttributeRow[]): AttributeRow[] {
  if (!rows || rows.length === 0) return rows
  const total = rows.length
  const greenCutoff = Math.max(3, Math.round(total * 0.3))
  const yellowCutoff = Math.max(greenCutoff + 3, Math.round(total * 0.7))
  return rows.map((row, idx) => {
    let fit_color: 'green'|'yellow'|'grey'
    if (idx < greenCutoff) fit_color = 'green'
    else if (idx < yellowCutoff) fit_color = 'yellow'
    else fit_color = 'grey'
    const fit_multiplier = multForColor(fit_color)
    const weighted_score = Math.round(row.weight * fit_multiplier)
    return { ...row, fit_color, fit_multiplier, weighted_score }
  })
}

async function persistJobFitResult(supabase: any, params: {
  dealId: number
  job_title: string
  job_description: string
  profileNarrative: string
  jd_summary: string | null
  fit_summary: string | null
  fit_score: number | null
  attributes: AttributeRow[]
}) {
  const jd_hash = sha256Hex(params.job_description || '')
  const profile_hash = sha256Hex(params.profileNarrative || '')
  const percent = (typeof params.fit_score === 'number' && isFinite(params.fit_score))
    ? Math.round(Math.max(0, Math.min(1, params.fit_score)) * 100)
    : 0
  const basePayload = {
    deal_id: params.dealId,
    job_title: params.job_title || null,
    jd_text: params.job_description || null,
    narrative: params.profileNarrative || null,
    jd_hash,
    profile_hash,
    analyzed_at: new Date().toISOString(),
    total_fit_percent: percent,
    industry_fit_percent: percent,
    process_fit_percent: percent,
    technical_fit_percent: percent,
  }
  const payload = {
    ...basePayload,
    jd_summary: params.jd_summary || null,
    fit_summary: params.fit_summary || null,
  }
  const up = await supabase.from('job_fit_summary').upsert(payload, { onConflict: 'deal_id' })
  if (up.error) {
    const msg = up.error.message || ''
    const missingColumns = /column\s+"?(jd_summary|fit_summary)"?/i.test(msg)
    if (!missingColumns) throw new Error(msg)
    const legacyPayload = { ...basePayload }
    const legacyUp = await supabase.from('job_fit_summary').upsert(legacyPayload, { onConflict: 'deal_id' })
    if (legacyUp.error) throw new Error(legacyUp.error.message)
  }
  await supabase.from('job_fit_attributes').delete().eq('deal_id', params.dealId)
  if (params.attributes?.length) {
    await (supabase.from('job_fit_attributes') as any).insert(params.attributes as any[])
  }
}

async function runPrompt2Categorization(supabase: any, dealId: number) {
  const prior = await supabase
    .from('jd_attribute_ranking')
    .select('deal_id, job_title, jd_hash, rank, attribute, category')
    .eq('deal_id', dealId)
    .order('rank', { ascending: true })
  if (prior.error) throw new Error(prior.error.message)
  const items: any[] = (prior.data as any[]) || []
  if (items.length === 0) return { categorized: 0, attempts: [] as Prompt2AttemptLog[] }

  const job_title = items[0]?.job_title || ''
  const jd_hash = items[0]?.jd_hash || null

  const system = [
    'You are a senior professional recruiter with over 30 years of experience across multiple industries, specializing in hiring for technology, operations, and enterprise leadership roles.',
    'Classify each job attribute into a primary fit category: "Industry Fit" (domain or sector), "Process Fit" (operational or methodological), or "Technical Fit" (skills, tools, systems, data).',
    'Preserve the original rank and attribute and include the previous category from input as previous_category.',
    'Include a short recruiter-style rationale for each. Return STRICT JSON array only.'
  ].join(' ')

  const inputList = items.map((r: any) => ({ rank: r.rank, attribute: r.attribute, category: r.category }))
  const user = `Input attributes (from Prompt 1):
${JSON.stringify(inputList, null, 2)}

Output an array of objects with keys: rank, attribute, previous_category, fit_category, rationale. Return ONLY valid JSON.`

  await supabase.from('jd_attribute_categories').delete().eq('deal_id', dealId)

  const attempts: Prompt2AttemptLog[] = []
  const maxAttempts = 2
  let cleanRows: any[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ai = await callOpenAI(system, user)
    const arr = Array.isArray(ai.data) ? ai.data : []
    const top = arr.filter((x: any) => Number.isFinite(+x.rank) && x.attribute)

    const log: Prompt2AttemptLog = {
      attempt,
      parse_error: ai.parse_error || null,
      raw_preview: clipSnippet(ai.raw),
      output_invalid: top.length === 0,
    }
    attempts.push(log)

    if (!top.length) continue

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

    cleanRows = rows.filter(r => r.rank >= 1 && r.rank <= 30 && r.attribute)
    if (!cleanRows.length) continue

    await (supabase.from('jd_attribute_categories') as any).insert(cleanRows as any[])
    break
  }

  return { categorized: cleanRows.length, attempts }
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
    'You must produce unique ranks strictly reflecting your judgment (do NOT mirror the incoming order).',
    'Consider what the role truly needs at the top versus nice-to-have lower priorities.',
    'Return STRICT JSON array only.'
  ].join(' ')

  const shuffled = items.slice().sort(() => Math.random() - 0.5)
  const inputList = shuffled.map((r: any) => ({ jd_rank: r.rank, refined_attribute: r.refined_attribute }))
  const user = `Job title: ${job_title || ''}\nBelow is a SHUFFLED list of refined attributes (with their original JD ranks for reference).\nEvaluate each attribute independently and assign YOUR OWN unique ranks (1 = most critical).\nInput:\n${JSON.stringify(inputList, null, 2)}\n\nOutput MUST be an array of objects with keys: rank (1-30, 1 highest, no duplicates), refined_attribute, relevance_score (1-10), rationale (1 concise sentence referencing the job title). Return ONLY valid JSON sorted by your rank.`

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

  const rows: AttributeRow[] = finalList.map((t) => {
    const weight = paretoWeight(t.final_rank)
    return {
      deal_id: dealId,
      attribute_name: t.label,
      category: t.pillar,
      jd_rank: t.jd_rank,
      title_rank: t.title_rank,
      final_rank: t.final_rank,
      weight,
      fit_color: 'grey',
      fit_multiplier: multForColor('grey'),
      weighted_score: Math.round(weight * multForColor('grey')),
    }
  })
  return { attributes_upserted: rows.length, attributes: rows }
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
    .select('jd_text, jd_summary, narrative, jd_hash, profile_hash, job_title, total_fit_percent, industry_fit_percent, process_fit_percent, technical_fit_percent, analyzed_at')
    .eq('deal_id', dealId)
    .maybeSingle()
  let jsData: any = (js as any).data || {}

  const submissionNotes = (dealData.submission_notes || '').toString()
  const submissionHasJD = submissionNotes.trim().length >= 40
  const missingStoredJD = !jsData.jd_text || String(jsData.jd_text || '').trim().length === 0

  let seededFromSubmission = false
  if (submissionHasJD && missingStoredJD) {
    const safePercent = (value: any) => (typeof value === 'number' && isFinite(value) ? value : 0)
    const jd_hash = sha256Hex(submissionNotes)
    const payload = {
      deal_id: dealId,
      job_title: dealData.job_title || jsData.job_title || null,
      jd_text: submissionNotes,
      jd_summary: jsData.jd_summary ?? null,
      narrative: jsData.narrative ?? null,
      jd_hash,
      profile_hash: jsData.profile_hash ?? null,
      total_fit_percent: safePercent(jsData.total_fit_percent),
      industry_fit_percent: safePercent(jsData.industry_fit_percent),
      process_fit_percent: safePercent(jsData.process_fit_percent),
      technical_fit_percent: safePercent(jsData.technical_fit_percent),
      analyzed_at: jsData.analyzed_at || new Date().toISOString(),
    }
    const up = await supabase.from('job_fit_summary').upsert(payload, { onConflict: 'deal_id' })
    if (up.error) {
      console.error('[attr-orchestrate] failed to seed jd_text', { dealId, error: up.error.message })
    } else {
      jsData = { ...jsData, ...payload }
      seededFromSubmission = true
    }
  }

  const storedJdText = (jsData.jd_text || '').toString()
  console.log('[attr-orchestrate] deal jd state', {
    dealId,
    submissionLen: submissionNotes.length,
    storedLen: storedJdText.length,
    submissionHasJD,
    missingStoredJD,
    seededFromSubmission,
  })

  const job_title = dealData.job_title || jsData.job_title || ''
  const job_description = storedJdText || submissionNotes || ''
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

  let p2 = { categorized: 0, attempts: [] } as any
  try { p2 = await runPrompt2Categorization(supabase, dealId) } catch (e: any) { p2 = { categorized: 0, error: String(e?.message ?? e), attempts: p2?.attempts || [] } }
  if (!p2 || Number(p2.categorized || 0) <= 0) {
    const fallback = await applyFallbackAttributesFromPrompt1(supabase, dealId, rankRows)
    return { deal_id: dealId, job_title, status: 'degraded', reason: 'prompt2_empty', prompt1: rankRows.length, prompt2: p2, fallback }
  }

  let p3 = { refined: 0 } as any
  try { p3 = await runPrompt3Refinement(supabase, dealId) } catch (e: any) { p3 = { refined: 0, error: String(e?.message ?? e) } }
  if (!p3 || Number(p3.refined || 0) <= 0) {
    const fallback = await applyFallbackAttributesFromPrompt1(supabase, dealId, rankRows)
    return { deal_id: dealId, job_title, status: 'degraded', reason: 'no_refined_attributes', prompt1: rankRows.length, prompt2: p2, prompt3: p3, fallback }
  }

  let p4 = { role_ranked: 0 } as any
  try { p4 = await runPrompt4Relevance(supabase, dealId) } catch (e: any) { p4 = { role_ranked: 0, error: String(e?.message ?? e) } }
  let mapped = { attributes_upserted: 0, attributes: [] as AttributeRow[] } as { attributes_upserted: number, attributes: AttributeRow[], error?: string }
  try { mapped = await mapPromptsToJobFitAttributes(supabase, dealId) } catch (e: any) { mapped = { attributes_upserted: 0, error: String(e?.message ?? e), attributes: [] } }
  if (!mapped || Number(mapped.attributes_upserted || 0) <= 0 || !Array.isArray(mapped.attributes) || mapped.attributes.length === 0) {
    const fallback = await applyFallbackAttributesFromPrompt1(supabase, dealId, rankRows)
    return { deal_id: dealId, job_title, status: 'degraded', reason: 'no_attributes_mapped', prompt1: rankRows.length, prompt2: p2, prompt3: p3, prompt4: p4, mapped, fallback }
  }

  let summaries: any = null
  let coloredAttrs: AttributeRow[] = []
  try {
    const resumeText = await getResumeText()
    const profileNarrative = resumeText || jsData.narrative || ''
    const system = 'You are a concise AI assistant for job referral preparation. Always return STRICT JSON only.'
    const user = `Create an enrichment JSON comparing the candidate profile to the job. Keep each summary under 120 words. Return ONLY strict JSON with keys: \n- jd_summary (string)\n- fit_summary (string)\n- keywords (object: {industry[], process[], technical[]} with up to 10 per pillar)\n- fit_score (number 0-1 or null)\n\nJob title: ${job_title || ''}\nCandidate Profile Narrative:\n${profileNarrative || '[none]'}\n\nJob text:\n${job_description || '[none]'}\n\nInstructions:\n- jd_summary: concise 2-4 sentence summary of the role in prose.\n- fit_summary: concise 2-4 sentences explicitly comparing the candidate profile to the job summary and likely keywords. Mention top strengths and any gaps.\n- keywords: extract and categorize important terms into industry, process, and technical; NO duplicates; cap 10 items per pillar; strings only.\n- fit_score: your estimate in [0,1] for how well the candidate fits the job.\n- No bullet lists. No URLs. Return ONLY valid JSON.`
    const ai = await callOpenAIJSON({ system, user })
    const obj = ai.data || {}
    const keywords = normalizeKeywords(obj.keywords)
    let fitScore = typeof obj.fit_score === 'number' && isFinite(obj.fit_score) ? Math.max(0, Math.min(1, obj.fit_score)) : null
    coloredAttrs = colorizeAttributes((mapped.attributes || []) as AttributeRow[])
    const summaryPayload = { jd_summary: obj.jd_summary || null, fit_summary: obj.fit_summary || null, fit_score: fitScore, keywords }
    try {
      await persistJobFitResult(supabase, {
        dealId,
        job_title,
        job_description,
        profileNarrative,
        jd_summary: summaryPayload.jd_summary,
        fit_summary: summaryPayload.fit_summary,
        fit_score: fitScore,
        attributes: coloredAttrs,
      })
    } catch (err) {
      console.error('[attr-orchestrate] summary persistence failed', { dealId, error: err instanceof Error ? err.message : String(err) })
    }
    summaries = summaryPayload
  } catch (err) {
    console.error('[attr-orchestrate] summary generation failed', { dealId, error: err instanceof Error ? err.message : String(err) })
  }

  return { deal_id: dealId, job_title, status: 'ok', prompt1: rankRows.length, prompt2: p2, prompt3: p3, prompt4: p4, attributes: coloredAttrs, summaries }

}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get('dealIds') || ''
    const dealIds = idsParam.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n))
    if (dealIds.length === 0) return NextResponse.json({ error: 'dealIds required, comma-separated' }, { status: 400 })

    const results = await Promise.all(dealIds.map((id) => processDeal(id)))

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
