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

function buildPrompt(company_name: string, research: string | null | undefined, referrer_name?: string) {
  const system = `You are helping Allen Walker write a short, heartfelt thank-you message for an internal referrer who is helping him connect with their company. You must follow all constraints exactly.`
  const researchText = research?.trim() || ''
  const user = `Write a two-paragraph message (under 180 words, plain text, no lists, no em-dashes).\nTone: warm, conversational, genuine. No jargon or grand claims.\nAudience: an internal referrer${referrer_name ? ` named ${referrer_name}` : ''}.\nGoal: thank them, show sincere interest in the company, and invite advice on next steps or introductions.\n\nInputs:\n- Company name: ${company_name}\n- Company research: ${researchText || '[none provided]'}\n- Allen profile URL: https://www.allenwalker.info/about\n- Allen background highlights: program delivery, GTM strategy, CRM systems, enterprise technology, healthcare IT, sustainability.\n\nInstructions:\n1) Paragraph 1: Thank them for supporting Allen’s job search and their time. Express enthusiasm for ${company_name} and reference its mission or purpose naturally, only using facts from the research if present. End with how Allen’s values align with the purpose.\n2) Paragraph 2: Briefly link Allen’s experience and passion to ${company_name}’s mission, products, or industry with concrete, relevant examples. End with a grounded note of gratitude and a clear call to action inviting advice on next steps or internal introductions.\n\nFormatting: two paragraphs, plain text, under 180 words total, no lists, no em-dashes, no placeholders. If research is missing, keep references general and accurate.`
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
      referrerName?: string
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
      const domain = props?.domain || ''
      if (desc) parts.push(String(desc))
      if (domain) parts.push(`Website: ${domain}`)
      research = parts.join('\n')
    } catch {}

    const prompt = buildPrompt(companyName, research, body.referrerName)
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
