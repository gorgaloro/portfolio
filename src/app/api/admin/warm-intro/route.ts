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

function buildPrompt(company_name: string, research: string | null | undefined) {
  const system = `You are helping Allen Walker write a short, heartfelt thank-you note for an internal referrer who is helping him connect with their company. Follow the constraints exactly.`
  const researchText = (research?.trim() || '')
  const user = `Write exactly two short paragraphs (under 180 words total). Output ONLY the body text — no greeting/salutation and no closing/sign-off.
Tone: warm, conversational, genuine. No jargon or grand claims.
Audience: an internal referrer.
Goal: thank them, show sincere interest in the company, and invite advice on next steps or introductions.

Inputs:
- Company name: ${company_name}
- Company research: ${researchText || '[none provided]'}
- Allen background highlights: program delivery, GTM strategy, CRM systems, enterprise technology, healthcare IT, sustainability.

Instructions:
1) Paragraph 1: Thank them for supporting Allen’s job search and their time. Express enthusiasm for ${company_name} and, if research is provided, naturally reference its mission or purpose using only accurate facts.
2) Paragraph 2: Briefly connect Allen’s experience and passion to ${company_name}’s mission, products, or industry with concrete, relevant examples. End with gratitude and a clear CTA inviting advice on next steps or internal introductions.

Strict formatting rules (must comply):
- Do NOT include any greeting or salutation (e.g., "Hi", "Hello", "Dear").
- Do NOT include any closing or signature (e.g., "Best", "Cheers", "Sincerely", names).
- Do NOT include any URLs.
- No lists, no em-dashes, no placeholders.`
  return { system, user }
}

async function callOpenAI(prompt: { system: string, user: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 240,
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
  return { content, usage: json?.usage, model: json?.model }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = Number(searchParams.get('companyId') || '0')
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    const supabase = getClient()
    const existing = await supabase.from('referral_warm_intros').select('*').eq('company_id', companyId).limit(1)
    if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 })
    return NextResponse.json({ intro: existing.data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      companyId?: number
      companyName?: string
      regenerate?: boolean
      message?: string
      saveOnly?: boolean
    }
    const companyId = Number(body.companyId || 0)
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

    const supabase = getClient()

    if (body.saveOnly && typeof body.message === 'string') {
      const up = await supabase.from('referral_warm_intros').upsert({
        company_id: companyId,
        company_name: body.companyName || null,
        message: body.message,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' }).select('*').limit(1)
      if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 })
      return NextResponse.json({ intro: up.data?.[0] || null })
    }

    const comp = await supabase.from('hubspot_companies').select('name, properties').eq('company_id', companyId).limit(1)
    if (comp.error) return NextResponse.json({ error: comp.error.message }, { status: 500 })
    const companyName = body.companyName || comp.data?.[0]?.name || `Company ${companyId}`
    let research = ''
    try {
      const props = (comp.data?.[0]?.properties as any) || {}
      const parts = [] as string[]
      const desc = props?.description || props?.about_us || ''
      if (desc) parts.push(String(desc))
      research = parts.join('\n')
    } catch {}

    const prompt = buildPrompt(companyName, research)
    const ai = await callOpenAI(prompt)

    const up = await supabase.from('referral_warm_intros').upsert({
      company_id: companyId,
      company_name: companyName,
      research_text: research || null,
      message: ai.content,
      model: ai.model || 'gpt-4o-mini',
      tokens_in: ai.usage?.prompt_tokens ?? null,
      tokens_out: ai.usage?.completion_tokens ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' }).select('*').limit(1)
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 })

    return NextResponse.json({ intro: up.data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
