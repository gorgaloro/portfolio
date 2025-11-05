export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const SUPABASE_FUNCTION_URL = 'https://rvochvbcvvhdbglxpwbj.functions.supabase.co/analyze-job-fit'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      companyId?: number
      pipeline?: string
      dealIds?: number[]
      profile_url?: string
      profile_html?: string
      recompute?: boolean
      debug?: boolean
    }

    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRole) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY on server' }, { status: 500 })
    }

    let dealIds = body.dealIds
    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      const params = new URLSearchParams()
      if (body.companyId) params.set('companyId', String(body.companyId))
      if (body.pipeline) params.set('pipeline', body.pipeline)
      const origin = new URL(req.url).origin
      const r = await fetch(`${origin}/api/company-jobs?${params.toString()}`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        dealIds = (j.deals ?? []).map((d: any) => d.deal_id)
      }
    }

    if (!dealIds || dealIds.length === 0) {
      return NextResponse.json({ ok: true, message: 'No deals found to analyze', results: [] })
    }

    const payload = {
      deal_ids: dealIds,
      profile_url: body.profile_url ?? 'https://www.allenwalker.info/about',
      profile_html: body.profile_html,
      recompute: body.recompute ?? false,
      debug: body.debug === true,
    }

    const resp = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const text = await resp.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { raw: text } }

    if (!resp.ok) return NextResponse.json({ error: json }, { status: resp.status })

    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
