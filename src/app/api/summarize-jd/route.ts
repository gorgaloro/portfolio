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

async function summarizeWithOpenAI(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You summarize job descriptions for a referral page. Output 3-4 concise sentences in a neutral, professional tone. No bullet points. Do not include company names or confidential info beyond the provided text.' },
      { role: 'user', content: `Summarize this job description for a candidate-facing referral page.\n\n${text}` },
    ],
    temperature: 0.3,
    max_tokens: 220,
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`OpenAI error: ${resp.status} ${t}`)
  }
  const json = await resp.json()
  const content: string | undefined = json?.choices?.[0]?.message?.content
  return (content || '').trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { dealIds?: number[] }
    const dealIds = (Array.isArray(body.dealIds) ? body.dealIds : []).filter((n) => typeof n === 'number')
    if (dealIds.length === 0) return NextResponse.json({ ok: true, updated: [] })

    const supabase = getClient()

    const { data: rows, error } = await supabase
      .from('job_fit_summary')
      .select('deal_id, jd_text, jd_summary')
      .in('deal_id', dealIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const targets = (rows || []).filter((r: any) => r?.jd_text && !r?.jd_summary)
    const updated: number[] = []

    for (const r of targets) {
      try {
        const summary = await summarizeWithOpenAI(r.jd_text as string)
        const up = await supabase
          .from('job_fit_summary')
          .update({ jd_summary: summary })
          .eq('deal_id', r.deal_id)
        if (up.error) throw up.error
        updated.push(r.deal_id)
      } catch (e) {
        // continue on errors for individual rows
      }
    }

    return NextResponse.json({ ok: true, updated })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
