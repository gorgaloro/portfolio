export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Container } from '@/components/Container'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ReferralContextCapture } from '@/components/referrals/ReferralContext'
import { Target, Briefcase, Users, TrendingUp } from 'lucide-react'

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

  const missingJD = deals.filter((d: any) => d?.summary?.jd_text && !d?.summary?.jd_summary)
  if (missingJD.length > 0) {
    await fetch(`${baseUrl}/api/summarize-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ dealIds: missingJD.map((d: any) => d.deal_id) }),
    }).catch(() => null)
    const refreshed2 = await fetchDeals()
    deals = refreshed2.deals
    companyName = refreshed2.company?.name || companyName
  }

  function CategoryList({ title, items }: { title: string, items: any[] }) {
    return (
      <div>
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{title}</h4>
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.attribute_name} className="flex items-center gap-3 text-sm">
              <span className={`inline-block h-3 w-3 rounded-full ${a.fit_color === 'green' ? 'bg-emerald-500' : a.fit_color === 'yellow' ? 'bg-amber-400' : 'bg-zinc-400 opacity-50'}`} />
              <span className="text-zinc-900 dark:text-zinc-100">{a.attribute_name}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  function JobFamiliesGrid() {
    const jobFamilies = [
      {
        title: 'Program Leadership',
        icon: Target,
        color: 'from-[#8B0000] to-[#A40000]',
        borderColor: 'border-red-200',
        accentColor: 'bg-[#8B0000]',
        roles: [
          'Project Director',
          'Program Manager',
          'Delivery Manager',
        ],
      },
      {
        title: 'Engineering Management',
        icon: Briefcase,
        color: 'from-[#2C3E50] to-[#34495E]',
        borderColor: 'border-slate-300',
        accentColor: 'bg-[#2C3E50]',
        roles: [
          'Application Manager',
          'Solution Architect',
          'Support Manager',
        ],
      },
      {
        title: 'Customer Enablement',
        icon: Users,
        color: 'from-[#17A2B8] to-[#20B2AA]',
        borderColor: 'border-teal-200',
        accentColor: 'bg-[#17A2B8]',
        roles: [
          'Customer Success Director',
          'Engagement Manager',
          'Customer Growth Manager',
        ],
      },
      {
        title: 'GTM Strategy & Execution',
        icon: TrendingUp,
        color: 'from-[#5B4D9D] to-[#6B5BAD]',
        borderColor: 'border-purple-200',
        accentColor: 'bg-[#5B4D9D]',
        roles: [
          'Business Operations Manager',
          'Solutions Engineering Manager',
          'Growth Program Manager',
        ],
      },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {jobFamilies.map((family) => {
          const Icon = family.icon
          return (
            <div
              key={family.title}
              className={`group relative border-2 ${family.borderColor} rounded-lg overflow-hidden hover:shadow-lg transition-all`}
            >
              <div className={`h-1 w-full bg-gradient-to-r ${family.color}`}></div>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${family.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="flex-1 leading-snug text-sm font-medium text-zinc-900 dark:text-zinc-100">{family.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {family.roles.map((role: string) => (
                    <li key={role} className="flex items-start gap-2 text-slate-700 dark:text-zinc-300">
                      <div className={`w-1.5 h-1.5 rounded-full ${family.accentColor} mt-2 flex-shrink-0`}></div>
                      <span className="text-xs leading-relaxed">{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Container className="mt-10 sm:mt-14">
      <div className="mt-10 space-y-12">
        <ReferralContextCapture slug="referral-template" company={companyName} showBackLink={false} onlyIfEmpty />
        {/* Roles with (Company) */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Roles with {companyName || 'Company'}</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 self-start">
              <p className="text-zinc-700 dark:text-zinc-300">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            <div className="flex md:col-span-5 justify-center shrink-0">
              <img src="/images/aw_headshot_360px.png" alt="Allen Walker" className="h-40 w-40 md:h-56 md:w-56 rounded-full ring-1 ring-zinc-900/10 object-cover mx-auto" />
            </div>
          </div>
        </section>

        {/* Targeted Job Families */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Targeted Job Families</h2>
          <div className="mt-4">
            <JobFamiliesGrid />
          </div>
        </section>

        {/* Jobs at Company */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Jobs at Company</h2>
          <div className="mt-4 space-y-6">
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
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">Job Description Summarized</div>
                    {s?.jd_text && !s?.jd_summary ? (
                      <div className="text-sm text-zinc-500">Summarizing job description…</div>
                    ) : s?.jd_summary ? (
                      <div className="text-sm text-zinc-700 dark:text-zinc-300">{s.jd_summary}</div>
                    ) : (
                      <div className="text-sm text-zinc-500">No job description available.</div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">Fit Summary</div>
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 min-h-24 whitespace-pre-wrap">{s?.narrative || 'Analyzing…'}</div>
                    </div>
                    <div className="md:col-span-1">
                      <div className="h-full rounded-lg ring-1 ring-zinc-900/10 flex items-center justify-center p-4">
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Fit Score</div>
                          <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">{s?.total_fit_percent != null ? `${Number(s.total_fit_percent).toFixed(0)}%` : '—'}</div>
                        </div>
                      </div>
                    </div>
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
        </section>

        {/* Call to Action */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Call to Action</h2>
          <div className="mt-2 h-0" />
        </section>
      </div>
    </Container>
  )
}
