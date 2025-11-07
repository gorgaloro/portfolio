export const dynamic = 'force-dynamic'
import { Container } from '@/components/Container'
import { Section } from '@/components/Section'
import Link from 'next/link'
import { headers } from 'next/headers'

export const metadata = {
  title: 'Referral Template',
  description: 'Base template for referral pages',
}

export default async function ReferralTemplatePage() {
  async function getBaseUrl() {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`
  }

  const baseUrl = await getBaseUrl()
  const companyId = 193056111306
  const pipelineId = '1320210144'

  async function fetchDeals() {
    const r = await fetch(`${baseUrl}/api/company-jobs?companyId=${companyId}&pipelineId=${encodeURIComponent(pipelineId)}`, { cache: 'no-store' })
    if (!r.ok) return { deals: [] as any[], company: undefined as any }
    return r.json() as Promise<{ deals: any[]; company?: { id: number; name: string } }>
  }

  const first = await fetchDeals()
  let { deals } = first
  let companyName: string | undefined = first.company?.name
  const missing = deals.filter(d => !d.summary)
  const needRecompute = deals.some(d => d.summary && Number(d.summary.total_fit_percent ?? 0) <= 0)
  if (missing.length > 0 || needRecompute) {
    await fetch(`${baseUrl}/api/analyze-job-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        dealIds: (missing.length ? missing : deals).map((d: any) => d.deal_id),
        profile_url: 'https://www.allenwalker.info/about',
        recompute: needRecompute
      })
    }).catch(() => null)
    const refreshed = await fetchDeals()
    deals = refreshed.deals
    companyName = refreshed.company?.name || companyName
  }

  function CategoryList({ title, items }: { title: string, items: any[] }) {
    return (
      <div>
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{title}</h4>
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.attribute_name} className="flex items-center gap-3 text-sm">
              <span className={`inline-block h-3 w-3 rounded-full ${a.fit_color === 'green' ? 'bg-emerald-500' : a.fit_color === 'yellow' ? 'bg-amber-400' : 'bg-zinc-400 opacity-50'}`} />
              <span className={a.fit_color === 'grey' ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}>{a.attribute_name}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Container className="mt-10 sm:mt-14">
      <div className="mt-10 space-y-12">
        <Section title="">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Roles with {companyName || 'Company'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2">
                <div className="min-h-[120px]" />
              </div>
              <div className="flex md:justify-end">
                <img src="/images/aw_headshot_360px.png" alt="Allen Walker" className="h-28 w-28 md:h-36 md:w-36 rounded-full ring-1 ring-zinc-900/10 object-cover" />
              </div>
            </div>
          </div>
        </Section>
        <Section title="Jobs I’m Targeting">
          <div className="h-0" />
        </Section>

        <Section title="Jobs at Company">
          <div className="space-y-6">
            {deals.length === 0 && (
              <div className="text-sm text-zinc-500">No jobs found for this company in pipeline ID “{pipelineId}”.</div>
            )}
            {deals.map((d) => {
              const attrs: any[] = d.attributes || []
              const priority: Record<string, number> = { green: 0, yellow: 1, grey: 2 }
              const sortByColor = (arr: any[]) => arr.sort((x, y) => (priority[x.fit_color] ?? 3) - (priority[y.fit_color] ?? 3))
              const byCat = {
                industry: sortByColor(attrs.filter(a => a.category === 'industry')).slice(0, 5),
                process: sortByColor(attrs.filter(a => a.category === 'process')).slice(0, 5),
                technical: sortByColor(attrs.filter(a => a.category === 'technical')).slice(0, 5),
              }
              const s = d.summary || {}
              return (
                <div key={d.deal_id} className="rounded-xl ring-1 ring-zinc-900/5 bg-white dark:bg-zinc-900 p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <Link href={d.job_url || '#'} target="_blank" className="text-lg font-semibold text-emerald-600 hover:underline">
                      {d.job_title || 'Untitled Role'}
                    </Link>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-zinc-500">Fit Score</div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{s?.total_fit_percent != null ? `${Number(s.total_fit_percent).toFixed(0)}%` : '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 min-h-24 whitespace-pre-wrap">{s?.narrative || 'Analyzing…'}</div>
                    </div>
                    <div className="md:col-span-1"></div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CategoryList title="Industry Fit" items={byCat.industry} />
                    <CategoryList title="Process Fit" items={byCat.process} />
                    <CategoryList title="Technical Fit" items={byCat.technical} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Call to Action">
          <div className="h-0" />
        </Section>
      </div>
    </Container>
  )
}
