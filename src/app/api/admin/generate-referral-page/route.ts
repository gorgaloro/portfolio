export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import type { ReferralPageRecord } from '@/lib/referralPagesStore'

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase server env')
  return createClient(url, key)
}

function slugify(input?: string | null) {
  const base = (input || '').toString().toLowerCase().trim()
  if (!base) return null
  return base
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function randomSuffix() {
  return crypto.randomBytes(3).toString('hex')
}

async function slugExistsInSupabase(client: SupabaseClient, slug: string) {
  try {
    const existing = await client
      .from('referral_pages')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()
    return !!existing?.data
  } catch (err) {
    console.error('Slug existence check failed', err)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const companyId = Number(body?.companyId)
    const companyName = (body?.companyName || '').toString().trim() || null
    const dealIds = Array.isArray(body?.dealIds)
      ? body.dealIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id))
      : []
    const pipelineId = (body?.pipelineId || '').toString().trim() || null

    if (!companyId || Number.isNaN(companyId)) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }
    if (!dealIds.length) {
      return NextResponse.json({ error: 'Select at least one job to include' }, { status: 400 })
    }

    const supabase = getClient()

    const baseSlug = slugify(companyName) || `company-${companyId}`
    let slug = ''
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${baseSlug}-${randomSuffix()}`
      const exists = await slugExistsInSupabase(supabase, candidate)
      if (!exists) {
        slug = candidate
        break
      }
    }
    if (!slug) slug = `${baseSlug}-${Date.now()}`

    const payload: ReferralPageRecord = {
      slug,
      company_id: companyId,
      company_name: companyName,
      pipeline_id: pipelineId,
      deal_ids: dealIds,
      status: 'ready',
    }

    const inserted = await supabase.from('referral_pages').insert(payload).select('slug').single()
    if (inserted.error) {
      return NextResponse.json({ error: inserted.error.message }, { status: 500 })
    }

    const origin = new URL(req.url).origin
    const shareUrl = `${origin}/referrals/${slug}`

    return NextResponse.json({ message: 'Referral page ready', slug, shareUrl }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to generate referral page' }, { status: 500 })
  }
}
