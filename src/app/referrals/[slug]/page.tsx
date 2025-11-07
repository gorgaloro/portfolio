export const dynamic = 'force-dynamic'

import ReferralTemplateView from '@/components/referrals/ReferralTemplateView'
import { ReferralContextCapture } from '@/components/referrals/ReferralContext'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

// Temporary mapping. Later we can fetch from DB/admin config.
const SLUG_MAP: Record<string, { companyId: number; pipelineId: string; company?: string }> = {}

export default async function ReferralPage(props: any) {
  const maybeParams = props?.params
  const resolved = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams
  const slug: string = resolved?.slug
  const m = SLUG_MAP[slug]
  if (!m) return notFound()

  async function getBaseUrl() {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`
  }

  let companyFromAPI: string | undefined
  try {
    const baseUrl = await getBaseUrl()
    const r = await fetch(`${baseUrl}/api/company-jobs?companyId=${m.companyId}&pipelineId=${encodeURIComponent(m.pipelineId)}`, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      companyFromAPI = j?.company?.name || undefined
    }
  } catch {}

  return (
    <>
      <ReferralContextCapture slug={slug} company={companyFromAPI || m.company} />
      {/* Render the template view with the company/pipeline config */}
      {/* This uses the normal site layout (header/footer) */}
      {/* and the header will show a return bar while context is active. */}
      <ReferralTemplateView companyId={m.companyId} pipelineId={m.pipelineId} />
    </>
  )
}
