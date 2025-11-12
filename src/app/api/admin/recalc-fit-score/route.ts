export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

async function callOpenAIJSON(prompt: { system: string, user: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 200,
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
    return { data: JSON.parse(cleaned) }
  } catch {
    return { data: { fit_score: null } }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      jd_summary?: string | null
      fit_summary?: string | null
      attributes?: Array<{ label: string; pillar: 'industry'|'process'|'technical'; color: 'green'|'yellow'|'grey'; final_rank: number; visible?: boolean }>
    }

    const attrs = (body.attributes || []).filter(a => a && a.label && a.pillar)
    const visible = attrs.filter(a => a.visible !== false)

    const system = 'You are a careful evaluator. Return ONLY strict JSON with a top-level key fit_score in the 0..1 range (number).'
    const user = `Given the following edited summaries and attributes, estimate a fit_score in [0,1]. Consider color (green>yellow>grey), rank (lower is stronger), and balance across pillars. Output JSON only: {"fit_score": number}.

JD Summary:\n${body.jd_summary || ''}

Fit Summary:\n${body.fit_summary || ''}

Attributes (visible only):\n${JSON.stringify(visible, null, 2)}`

    const ai = await callOpenAIJSON({ system, user })
    let score = ai.data?.fit_score
    if (typeof score !== 'number' || !isFinite(score)) score = null

    return NextResponse.json({ fit_score: score })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
