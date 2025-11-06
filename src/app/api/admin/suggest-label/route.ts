export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

async function openaiSuggestLabel(attribute: string, pillar: string, maxWords: number) {
  if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
  const system = 'You produce concise JSON only. Output strictly valid JSON. No prose.'
  const user = `Rewrite the attribute into a short, human-readable skill label.\n- Keep it at or under ${maxWords} words.\n- Keep the same meaning.\n- Use natural phrasing.\n- Pillar context: ${pillar}.\nInput attribute: ${attribute}`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Return ONLY JSON: {\n  \"label\": string\n}\n\n${user}` }
      ]
    })
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`OpenAI error ${resp.status}: ${t.slice(0, 200)}`)
  }
  const json = await resp.json()
  let content = json.choices?.[0]?.message?.content || '{}'
  try {
    const obj = JSON.parse(content)
    const label = String(obj?.label || '').trim()
    return label
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { attribute?: string, pillar?: string, max_words?: number }
    const attribute = (body.attribute || '').toString().trim()
    const pillar = (body.pillar || 'technical').toString().toLowerCase()
    const maxWords = Math.max(1, Math.min(8, Number(body.max_words ?? 5)))
    if (!attribute) return NextResponse.json({ error: 'attribute required' }, { status: 400 })

    const raw = await openaiSuggestLabel(attribute, pillar, maxWords)
    const label = raw
      .replace(/\s+/g, ' ')
      .replace(/[\.:;]+$/g, '')
      .trim()
      .split(' ')
      .slice(0, maxWords)
      .join(' ')

    return NextResponse.json({ label })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
