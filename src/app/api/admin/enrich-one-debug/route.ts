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
  const cleaned = content.replace(/^```(?:json)?\n?|\n?```$/g, '')
  try {
    return { data: JSON.parse(cleaned), usage: json?.usage, model: json?.model, raw: content }
  } catch {
    return { data: { jd_summary: content, fit_summary: '', keywords: { industry: [], process: [], technical: [] }, fit_score: null }, usage: json?.usage, model: json?.model, raw: content }
  }
}

async function runDeal(dealId: number) {
  const supabase = getClient()

  const dResp = await supabase
    .from('hubspot_deals')
    .select('deal_id, job_title, submission_notes')
    .eq('deal_id', dealId)
    .maybeSingle()
  if (dResp.error || !dResp.data) return NextResponse.json({ error: dResp.error?.message || 'Deal not found' }, { status: 404 })

  const fResp = await supabase
    .from('job_fit_summary')
    .select('deal_id, jd_text, narrative, total_fit_percent')
    .eq('deal_id', dealId)
    .maybeSingle()

  const resumeText = await getResumeText()
  const jdText: string = (fResp.data?.jd_text || dResp.data.submission_notes || '').toString()
  const profileNarrative: string = (fResp.data?.narrative || resumeText || '').toString()
  const priorScore: number | null = (typeof fResp.data?.total_fit_percent === 'number' && isFinite(fResp.data.total_fit_percent as number))
    ? Math.max(0, Math.min(1, (fResp.data.total_fit_percent as number) / 100))
    : null

  const system = 'You are a concise AI assistant for job referral preparation. Always return STRICT JSON only.'
  const priorNote = priorScore != null ? `\nReference prior fit score (optional): ${priorScore}` : ''
  const user = `Create an enrichment JSON comparing the candidate profile to the job. Keep each summary under 120 words. Return ONLY strict JSON with keys: \n- jd_summary (string)\n- fit_summary (string)\n- keywords (object: {industry[], process[], technical[]} with up to 10 per pillar)\n- fit_score (number 0-1 or null)\n\nJob title: ${dResp.data.job_title || ''}\nCandidate Profile Narrative:\n${profileNarrative || '[none]'}\n\nJob text:\n${jdText || '[none]'}\n${priorNote}\n\nInstructions:\n- jd_summary: concise 2-4 sentence summary of the role in prose.\n- fit_summary: concise 2-4 sentences explicitly comparing the candidate profile to the job summary and likely keywords. Mention top strengths and any gaps.\n- keywords: extract and categorize important terms into industry, process, and technical; NO duplicates; cap 10 items per pillar; strings only.\n- fit_score: your estimate in [0,1] for how well the candidate fits the job.\n- No bullet lists. No URLs. Return ONLY valid JSON.`

  const ai = await callOpenAIJSON({ system, user })
  const obj = ai.data || {}

  let scoreVal = obj.fit_score ?? null
  if (typeof scoreVal !== 'number' || !isFinite(scoreVal)) scoreVal = priorScore

  const debugRecord = {
    deal_id: dResp.data.deal_id,
    job_title: dResp.data.job_title || null,
    model: ai.model || 'gpt-4o-mini',
    usage: ai.usage || null,
    raw: ai.raw || null,
    parsed: obj || null,
    prompt: { system, user },
    resume_bytes: (resumeText || '').length,
  }

  await supabase.from('enrichment_debug').insert(debugRecord)

  return NextResponse.json({
    result: {
      ...debugRecord,
      fit_score: scoreVal ?? null,
    }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { dealId?: number }
    const dealId = Number(body.dealId)
    if (!Number.isFinite(dealId)) return NextResponse.json({ error: 'dealId required' }, { status: 400 })
    return runDeal(dealId)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const dealId = Number(url.searchParams.get('dealId'))
    if (!Number.isFinite(dealId)) return NextResponse.json({ error: 'dealId required' }, { status: 400 })
    return runDeal(dealId)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
