export const dynamic = 'force-dynamic'

import ReferralTemplateView from '@/components/referrals/ReferralTemplateView'
import { ReferralContextCapture } from '@/components/referrals/ReferralContext'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getReferralPageFromStore, type ReferralPageRecord } from '@/lib/referralPagesStore'

type ReferralPageConfig = {
  slug: string
  company_id: number
  company_name?: string | null
  pipeline_id?: string | null
  deal_ids?: number[] | null
}

function getAdminClientOrNull(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch (err) {
    console.error('Failed to create Supabase client', err)
    return null
  }
}

async function loadReferralConfig(slug: string): Promise<ReferralPageConfig | null> {
  const supabase = getAdminClientOrNull()
  if (supabase) {
    try {
      const result = await supabase
        .from('referral_pages')
        .select('slug, company_id, company_name, pipeline_id, deal_ids')
        .eq('slug', slug)
        .maybeSingle()
      if (result.data && !result.error) {
        return result.data as ReferralPageConfig
      }
      if (result.error) {
        console.warn('Supabase referral_pages lookup failed, falling back', result.error)
      }
    } catch (err) {
      console.warn('Supabase referral page fetch threw, falling back', err)
    }
  }

  const local = await getReferralPageFromStore(slug)
  return local ? (local as ReferralPageConfig) : null
}

export default async function ReferralPage(props: any) {
  const maybeParams = props?.params
  const resolved = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams
  const slug: string = resolved?.slug
  if (!slug) return notFound()

  const config = await loadReferralConfig(slug)
  if (!config?.company_id) return notFound()

  async function getBaseUrl() {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`
  }

  let companyFromAPI: string | undefined
  try {
    const baseUrl = await getBaseUrl()
    const pipeline = config.pipeline_id ? `&pipelineId=${encodeURIComponent(config.pipeline_id)}` : ''
    const r = await fetch(`${baseUrl}/api/company-jobs?companyId=${config.company_id}${pipeline}`, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      companyFromAPI = j?.company?.name || undefined
    }
  } catch {}

  return (
    <>
      <ReferralContextCapture slug={slug} company={companyFromAPI || config.company_name || undefined} />
      <ReferralTemplateView companyId={config.company_id} pipelineId={config.pipeline_id || '1320210144'} />
    </>
  )
}
