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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = Number(searchParams.get('companyId') || '0')
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    const supabase = getClient()
    const intro = await supabase
      .from('referral_warm_intros')
      .select('company_id, company_name, message, updated_at')
      .eq('company_id', companyId)
      .limit(1)
    if (intro.error) return NextResponse.json({ error: intro.error.message }, { status: 500 })
    const row = intro.data?.[0] || null
    return NextResponse.json({ intro: row })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
