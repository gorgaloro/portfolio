export const dynamic = 'force-dynamic'

import ReferralTemplateView from '@/components/referrals/ReferralTemplateView'
import { ReferralContextCapture } from '@/components/referrals/ReferralContext'

// Temporary mapping. Later we can fetch from DB/admin config.
const SLUG_MAP: Record<string, { companyId: number; pipelineId: string; company?: string }> = {
  'databricks-2025': { companyId: 193056111306, pipelineId: '1320210144', company: 'Databricks' },
}

export default async function ReferralPage(props: any) {
  const maybeParams = props?.params
  const resolved = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams
  const slug: string = resolved?.slug
  const m = SLUG_MAP[slug] ?? { companyId: 193056111306, pipelineId: '1320210144' }

  return (
    <>
      <ReferralContextCapture slug={slug} company={m.company} />
      {/* Render the template view with the company/pipeline config */}
      {/* This uses the normal site layout (header/footer) */}
      {/* and the header will show a return bar while context is active. */}
      <ReferralTemplateView companyId={m.companyId} pipelineId={m.pipelineId} />
    </>
  )
}
