export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normLabel(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countInParagraphs(text: string, term: string) {
  const paras = String(text || '').split(/\n\s*\n+/)
  const headRe = /(responsibil|requirement|qualification|what you|you will|who you are|about you)/i
  let base = 0
  let boosted = 0
  for (const p of paras) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi')
    const matches = p.match(re)
    if (!matches) continue
    const n = matches.length
    if (headRe.test(p)) boosted += n
    else base += n
  }
  return { base, boosted }
}

function buildRankedAttributes(jdText: string, jobTitle: string | null, kw: { industry?: string[]; process?: string[]; technical?: string[] }) {
  const items: Array<{ label: string; pillar: 'industry'|'process'|'technical'; score: number }> = []
  const title = String(jobTitle || '')
  const add = (list: any[], pillar: 'industry'|'process'|'technical') => {
    const arr = Array.isArray(list) ? list.slice(0, 10) : []
    for (const raw of arr) {
      const label = String(raw || '').trim()
      if (!label) continue
      const { base, boosted } = countInParagraphs(jdText, label)
      let s = base + 2 * boosted
      if (title && new RegExp(`\\b${escapeRegExp(label)}\\b`, 'i').test(title)) s += 3
      // slight pillar bias to surface actionable/technical items first
      if (pillar === 'technical') s += 0.5
      else if (pillar === 'process') s += 0.3
      items.push({ label, pillar, score: s })
    }
  }
  add(kw.industry || [], 'industry')
  add(kw.process || [], 'process')
  add(kw.technical || [], 'technical')

  // Deduplicate by normalized label; if conflict, prefer process > technical > industry
  const pickOrder: ('process'|'technical'|'industry')[] = ['process', 'technical', 'industry']
  const byKey = new Map<string, { label: string; pillar: 'industry'|'process'|'technical'; score: number }>()
  for (const it of items) {
    const k = normLabel(it.label)
    const prev = byKey.get(k)
    if (!prev) { byKey.set(k, it); continue }
    // prefer higher score or preferred pillar
    const prevIdx = pickOrder.indexOf(prev.pillar as any)
    const curIdx = pickOrder.indexOf(it.pillar as any)
    if (it.score > prev.score + 0.1 || curIdx < prevIdx) {
      byKey.set(k, it)
    }
  }

  const unique = Array.from(byKey.values())
  unique.sort((a, b) => (b.score - a.score) || a.pillar.localeCompare(b.pillar) || a.label.localeCompare(b.label))
  // Assign final ranks 1..N
  return unique.map((u, i) => ({ attribute_name: u.label, label: u.label, pillar: u.pillar, color: 'grey' as const, final_rank: i + 1, visible: true }))
}

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
    // Default public profile fallback
    try {
      const r = await fetch('https://www.allenwalker.info/about')
      if (r.ok) return htmlToText(await r.text())
    } catch {}
  } catch {}
  return ''
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
      ],
    })
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${text}`)
  const json = JSON.parse(text)
  const content: string = json?.choices?.[0]?.message?.content?.trim() || ''
  // try parse as JSON; if wrapped or with code fences, strip
  const cleaned = content.replace(/^```(?:json)?\n?|\n?```$/g, '')
  try {
    return { data: JSON.parse(cleaned), usage: json?.usage, model: json?.model }
  } catch {
    // fallback minimal shape
    return { data: { jd_summary: content, fit_summary: '', keywords: { industry: [], process: [], technical: [] }, fit_score: null }, usage: json?.usage, model: json?.model }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      dealIds?: number[]
      options?: { summary?: boolean, fit?: boolean, keywords?: boolean, score?: boolean }
      preview?: boolean
    }

    const dealIds = (body.dealIds || []).filter((x) => Number.isFinite(x)).map((x) => Number(x))
    if (dealIds.length === 0) return NextResponse.json({ error: 'dealIds required' }, { status: 400 })

    const supabase = getClient()

    // fetch deal basics and any existing jd_text
    const dealsResp = await supabase
      .from('hubspot_deals')
      .select('deal_id, job_title, submission_notes')
      .in('deal_id', dealIds)
    if (dealsResp.error) return NextResponse.json({ error: dealsResp.error.message }, { status: 500 })

    const fitResp = await supabase
      .from('job_fit_summary')
      .select('deal_id, jd_text, jd_summary, narrative, total_fit_percent')
      .in('deal_id', dealIds)
    // fitResp may error in some envs; tolerate
    const fitMap = new Map<number, any>()
    if (!fitResp.error) for (const r of (fitResp.data || [])) fitMap.set(r.deal_id, r)

    const results: any[] = []
    const resumeText = await getResumeText()
    for (const d of dealsResp.data || []) {
      const existing = fitMap.get(d.deal_id)
      const jdText: string = (existing?.jd_text || d.submission_notes || '').toString()
      const profileNarrative: string = (existing?.narrative || resumeText || '').toString()
      const priorScore: number | null = (typeof existing?.total_fit_percent === 'number' && isFinite(existing.total_fit_percent))
        ? Math.max(0, Math.min(1, (existing.total_fit_percent as number) / 100))
        : null
      const options = body.options || { summary: true, fit: true, keywords: true, score: true }

      const system = 'You are a concise AI assistant for job referral preparation. Always return STRICT JSON only.'
      const priorNote = priorScore != null ? `\nReference prior fit score (optional): ${priorScore}` : ''
      const user = `Create an enrichment JSON comparing the candidate profile to the job. Keep each summary under 120 words. Return ONLY strict JSON with keys: \n- jd_summary (string)\n- fit_summary (string)\n- keywords (object: {industry[], process[], technical[]} with up to 10 per pillar)\n- fit_score (number 0-1 or null)\n\nJob title: ${d.job_title || ''}\nCandidate Profile Narrative:\n${profileNarrative || '[none]'}\n\nJob text:\n${jdText || '[none]'}\n${priorNote}\n\nInstructions:\n- jd_summary: concise 2-4 sentence summary of the role in prose.\n- fit_summary: concise 2-4 sentences explicitly comparing the candidate profile to the job summary and likely keywords. Mention top strengths and any gaps.\n- keywords: extract and categorize important terms into industry, process, and technical; NO duplicates; cap 10 items per pillar; strings only.\n- fit_score: your estimate in [0,1] for how well the candidate fits the job.\n- No bullet lists. No URLs. Return ONLY valid JSON.`
      const ai = await callOpenAIJSON({ system, user })
      const obj = ai.data || {}

      let scoreVal = options.score !== false ? (obj.fit_score ?? null) : null
      if (typeof scoreVal !== 'number' || !isFinite(scoreVal)) scoreVal = priorScore

      // Build ranked attributes from keywords using JD salience and title boosts
      const kw = (obj.keywords || {}) as { industry?: string[]; process?: string[]; technical?: string[] }
      const attrs: any[] = buildRankedAttributes(jdText, d.job_title || null, kw)

      results.push({
        deal_id: d.deal_id,
        job_title: d.job_title || null,
        jd_summary: options.summary !== false ? (obj.jd_summary || null) : null,
        fit_summary: options.fit !== false ? (obj.fit_summary || null) : null,
        keywords: options.keywords !== false ? (obj.keywords || { industry: [], process: [], technical: [] }) : { industry: [], process: [], technical: [] },
        attributes: attrs,
        fit_score: scoreVal ?? null,
        model: ai.model || 'gpt-4o-mini',
      })
    }

    // For preview flow, do not persist. Return results only.
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
