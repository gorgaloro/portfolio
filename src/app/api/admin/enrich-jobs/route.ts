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
    for (const d of dealsResp.data || []) {
      const existing = fitMap.get(d.deal_id)
      const jdText: string = (existing?.jd_text || d.submission_notes || '').toString()
      const options = body.options || { summary: true, fit: true, keywords: true, score: true }

      const system = 'You are a concise AI assistant for job referral preparation. Always return strict JSON.'
      const user = `From the following job text, produce an enrichment JSON. Keep each summary under 120 words. If text is missing, infer conservatively. Output strict JSON with keys: jd_summary (string), fit_summary (string), keywords (object with arrays industry, process, technical each up to 6 strings), fit_score (number 0-1 or null).\n\nJob title: ${d.job_title || ''}\nJob text:\n${jdText || '[none]'}\n\nConstraints:\n- No lists in summaries.\n- No URLs.\n- Return only valid JSON.`
      const ai = await callOpenAIJSON({ system, user })
      const obj = ai.data || {}

      results.push({
        deal_id: d.deal_id,
        job_title: d.job_title || null,
        jd_summary: options.summary !== false ? (obj.jd_summary || null) : null,
        fit_summary: options.fit !== false ? (obj.fit_summary || null) : null,
        keywords: options.keywords !== false ? (obj.keywords || { industry: [], process: [], technical: [] }) : { industry: [], process: [], technical: [] },
        fit_score: options.score !== false ? (obj.fit_score ?? null) : null,
        model: ai.model || 'gpt-4o-mini',
      })
    }

    // For preview flow, do not persist. Return results only.
    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
