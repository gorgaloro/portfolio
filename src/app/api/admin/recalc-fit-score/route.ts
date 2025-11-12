export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

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
    const url = process.env.RESUME_URL || 'https://www.allenwalker.info/about'
    try {
      const r = await fetch(url)
      if (r.ok) return htmlToText(await r.text())
    } catch {}
  } catch {}
  return ''
}

async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  })
  const j = await resp.json()
  if (!resp.ok) throw new Error(`OpenAI embeddings error ${resp.status}: ${JSON.stringify(j)}`)
  const v = j?.data?.[0]?.embedding
  if (!Array.isArray(v)) throw new Error('Invalid embedding response')
  return v as number[]
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) { const x = a[i], y = b[i]; dot += x*y; na += x*x; nb += y*y }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function lexicalRatio(term: string, corpus: string): number {
  const t = term.toLowerCase()
  const c = corpus.toLowerCase()
  const tokens = t.split(/[^a-z0-9+]+/g).filter(Boolean)
  if (tokens.length === 0) return 0
  let matched = 0
  for (const w of tokens) if (c.includes(w)) matched++
  return matched / tokens.length
}

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
    // Try to extract a numeric score even if not valid JSON
    let m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)\s*%/)
    let val: number | null = null
    if (m) {
      const pct = parseFloat(m[1])
      if (isFinite(pct)) val = pct / 100
    } else {
      m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/)
      if (m) {
        const num = parseFloat(m[1])
        if (isFinite(num)) val = num > 1 ? (num <= 100 ? num / 100 : null) : num
      }
    }
    if (typeof val === 'number') {
      val = Math.max(0, Math.min(1, val))
    }
    return { data: { fit_score: val } }
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
    const visible = attrs.filter(a => a.visible !== false).sort((a,b) => (a.final_rank||999) - (b.final_rank||999))

    // Deterministic Pareto-weighted scoring using semantic + lexical match
    if (visible.length > 0) {
      const resumeText = await getResumeText()
      let resumeVec: number[] | null = null
      if (resumeText) {
        // Truncate for embedding safety
        const truncated = resumeText.slice(0, 8000)
        resumeVec = await embedText(truncated)
      }

      const decay = 0.6
      let sumW = 0
      let sumScore = 0
      const attrUpdates: any[] = []
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i]
        const rank = Math.max(1, Number(a.final_rank) || (i+1))
        const weight = 100 * Math.pow(decay, rank - 1)
        const mult = a.color === 'green' ? 1.0 : a.color === 'yellow' ? 0.65 : 0.0

        let semantic = 0
        if (resumeVec) {
          try {
            const termVec = await embedText(String(a.label))
            semantic = cosine(termVec, resumeVec)
          } catch {}
        }
        const lexical = resumeText ? lexicalRatio(String(a.label), resumeText) : 0
        const hybrid = 0.85 * semantic + 0.15 * lexical

        // Map hybrid similarity to color multiplier if provided color seems default/unknown
        const inferredMult = hybrid >= 0.80 ? 1.0 : hybrid >= 0.60 ? 0.65 : 0.0
        const effMult = isFinite(mult) ? Math.max(mult, inferredMult) : inferredMult

        const auto_color = hybrid >= 0.80 ? 'green' : (hybrid >= 0.60 ? 'yellow' : 'grey')
        attrUpdates.push({ label: a.label, auto_color, match_score: hybrid })

        sumW += weight
        sumScore += weight * effMult
      }
      if (sumW > 0) {
        const score = sumScore / sumW
        return NextResponse.json({ fit_score: Math.max(0, Math.min(1, score)), attributes: attrUpdates })
      }
    }

    // Fallback to model-estimated score when no attributes
    const system = 'You are a careful evaluator. Return ONLY strict JSON with a top-level key fit_score in the 0..1 range (number).'
    const user = `Given the following edited summaries, estimate a fit_score in [0,1]. Output JSON only: {"fit_score": number}.

JD Summary:\n${body.jd_summary || ''}

Fit Summary:\n${body.fit_summary || ''}`
    const ai = await callOpenAIJSON({ system, user })
    let score = ai.data?.fit_score
    if (typeof score !== 'number' || !isFinite(score)) score = null
    return NextResponse.json({ fit_score: score, attributes: [] })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
