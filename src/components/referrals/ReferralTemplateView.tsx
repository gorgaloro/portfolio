import { Container } from '@/components/Container'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ReferralContextCapture } from '@/components/referrals/ReferralContext'
import { ReferralCTASection } from '@/components/referrals/ReferralCTASection'
import { Target, Briefcase, Users, TrendingUp } from 'lucide-react'

const LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/in/allenhwalker'
const EMAIL_ADDRESS = process.env.NEXT_PUBLIC_REFERRAL_EMAIL || 'referrals@allenwalker.info'
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/allen-bayconnectors'
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/allenhwalker'
const SUBSTACK_URL = process.env.NEXT_PUBLIC_SUBSTACK_URL || 'https://substack.com/@bayconnectors'
const BLUESKY_URL = process.env.NEXT_PUBLIC_BLUESKY_URL || 'https://bsky.app/profile/bayconnectors.bsky.social'

export default async function ReferralTemplateView({
  companyId,
  pipelineId,
}: {
  companyId: number
  pipelineId: string
}) {
  async function getBaseUrl() {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`
  }

  async function fetchIntro(baseUrl: string, company: number) {
    const r = await fetch(`${baseUrl}/api/company-intro?companyId=${company}`, { cache: 'no-store' })
    if (!r.ok) return null
    try {
      const j = await r.json()
      return j.intro || null
    } catch {
      return null
    }
  }

  const baseUrl = await getBaseUrl()

  async function fetchDeals() {
    const r = await fetch(
      `${baseUrl}/api/company-jobs?companyId=${companyId}&pipelineId=${encodeURIComponent(pipelineId)}`,
      { cache: 'no-store' },
    )
    if (!r.ok) return { deals: [] as any[], company: undefined as any }
    return r.json() as Promise<{ deals: any[]; company?: { id: number; name: string } }>
  }

  const first = await fetchDeals()
  let { deals } = first
  let companyName: string | undefined = first.company?.name
  const missing = deals.filter((d) => !d.summary)
  const needRecompute = deals.some((d) => d.summary && Number(d.summary.total_fit_percent ?? 0) <= 0)
  if (missing.length > 0 || needRecompute) {
    await fetch(`${baseUrl}/api/analyze-job-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        dealIds: (missing.length ? missing : deals).map((d: any) => d.deal_id),
        profile_url: 'https://www.allenwalker.info/about',
        recompute: needRecompute,
      }),
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

  const intro = await fetchIntro(baseUrl, companyId)

  function CategoryList({ title, items }: { title: string; items: any[] }) {
    return (
      <div>
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{title}</h4>
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.attribute_name} className="flex items-center gap-3 text-sm">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  a.fit_color === 'green'
                    ? 'bg-emerald-500'
                    : a.fit_color === 'yellow'
                      ? 'bg-amber-400'
                      : 'bg-zinc-400 opacity-50'
                }`}
              />
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
        roles: ['Project Director', 'Program Manager', 'Delivery Manager'],
      },
      {
        title: 'Engineering Management',
        icon: Briefcase,
        color: 'from-[#2C3E50] to-[#34495E]',
        borderColor: 'border-slate-300',
        accentColor: 'bg-[#2C3E50]',
        roles: ['Application Manager', 'Solution Architect', 'Support Manager'],
      },
      {
        title: 'Customer Enablement',
        icon: Users,
        color: 'from-[#17A2B8] to-[#20B2AA]',
        borderColor: 'border-teal-200',
        accentColor: 'bg-[#17A2B8]',
        roles: ['Customer Success Director', 'Engagement Manager', 'Customer Growth Manager'],
      },
      {
        title: 'GTM Strategy & Execution',
        icon: TrendingUp,
        color: 'from-[#5B4D9D] to-[#6B5BAD]',
        borderColor: 'border-purple-200',
        accentColor: 'bg-[#5B4D9D]',
        roles: ['Operations Manager', 'Sales Engineer', 'Revenue Systems Manager'],
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
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10">
                  {family.title === 'Program Leadership' && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                      Find out how I support{' '}
                      <Link href="/program-delivery" className="font-medium text-emerald-600 hover:underline">
                        program delivery
                      </Link>
                      .
                    </span>
                  )}
                  {family.title === 'Engineering Management' && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                      Find out how I support{' '}
                      <Link href="/tech-stack" className="font-medium text-emerald-600 hover:underline">
                        technical teams
                      </Link>
                      .
                    </span>
                  )}
                  {family.title === 'Customer Enablement' && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                      Find out how I support{' '}
                      <Link href="/business-development" className="font-medium text-emerald-600 hover:underline">
                        customer success
                      </Link>
                      .
                    </span>
                  )}
                  {family.title === 'GTM Strategy & Execution' && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                      Find out how I support{' '}
                      <Link href="/business-development" className="font-medium text-emerald-600 hover:underline">
                        Growth
                      </Link>{' '}
                      and{' '}
                      <Link href="/board-advisory" className="font-medium text-emerald-600 hover:underline">
                        Startups
                      </Link>
                      .
                    </span>
                  )}
                </div>
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

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Roles with {companyName || 'Company'}
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 self-start">
              <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {intro?.message ||
                  'This page gives a concise view of how my background aligns with roles at this company. Below you will find a brief fit summary for each role, along with the key industry, process, and technical attributes that map to my experience. Use the Email Referral Generator at the bottom to share a polished recommendation.'}
              </div>
            </div>
            <div className="flex md:col-span-5 justify-center shrink-0">
              <img
                src="/images/aw_headshot_360px.png"
                alt="Allen Walker"
                className="h-40 w-40 md:h-56 md:w-56 rounded-full ring-1 ring-zinc-900/10 object-cover mx-auto"
              />
            </div>
          </div>
          <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-white/10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Connect</h3>
                <div className="mt-3 space-y-2.5">
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3.5 py-2.5 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F0FF]">
                      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-[#0A66C2]">
                        <path
                          d="M20.45 3H3.55A.55.55 0 0 0 3 3.55v16.9c0 .3.25.55.55.55h16.9c.3 0 .55-.25.55-.55V3.55A.55.55 0 0 0 20.45 3ZM8.1 18.5H5.6V9.75h2.5ZM6.85 8.6a1.45 1.45 0 1 1 0-2.9 1.45 1.45 0 0 1 0 2.9Zm11.65 9.9h-2.5v-4.3c0-1.05-.02-2.4-1.45-2.4-1.45 0-1.67 1.14-1.67 2.32v4.38h-2.5V9.75h2.4v1.19h.03c.33-.63 1.16-1.3 2.4-1.3 2.57 0 3.05 1.7 3.05 3.9Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">LinkedIn</span>
                    <svg
                      className="ml-auto h-4 w-4 text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href={`mailto:${EMAIL_ADDRESS}`}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3.5 py-2.5 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                        <path
                          d="M4 7.5 10.6 12a2.8 2.8 0 0 0 2.8 0L20 7.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email</span>
                    <svg
                      className="ml-auto h-4 w-4 text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Meet</h3>
                <div className="mt-3">
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3.5 py-2.5 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                        <path
                          d="M8 3v2M16 3v2M5 7h14M6 11h2m3 0h2m3 0h2M6 15h2m3 0h2m3 0h2M6 19h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Book a Meeting</span>
                    </div>
                    <svg
                      className="ml-auto h-4 w-4 text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Follow</h3>
                <div className="mt-3 space-y-2.5">
                  {[
                    {
                      label: 'GitHub',
                      href: GITHUB_URL,
                      iconBg: 'bg-zinc-900/5',
                      icon: (
                        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-zinc-900">
                          <path
                            fill="currentColor"
                            d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.57.11.78-.25.78-.55v-2.1c-3.18.7-3.85-1.37-3.85-1.37-.52-1.32-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.76.4-1.26.73-1.55-2.54-.29-5.22-1.27-5.22-5.63 0-1.24.44-2.25 1.16-3.05-.12-.29-.5-1.46.11-3.04 0 0 .95-.3 3.12 1.16a10.8 10.8 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.61 1.58.23 2.75.11 3.04.72.8 1.16 1.81 1.16 3.05 0 4.38-2.69 5.33-5.24 5.61.41.35.78 1.04.78 2.11v3.13c0 .3.2.67.79.55A11.5 11.5 0 0 0 12 .5Z"
                          />
                        </svg>
                      ),
                    },
                    {
                      label: 'Substack',
                      href: SUBSTACK_URL,
                      iconBg: 'bg-orange-500/10',
                      icon: (
                        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-orange-500">
                          <path fill="currentColor" d="M4 5h16v2H4z" />
                          <path fill="currentColor" d="M4 9h16v2H4z" />
                          <path fill="currentColor" d="M4 13h16v6l-8-3-8 3z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Bluesky',
                      href: BLUESKY_URL,
                      iconBg: 'bg-sky-100',
                      icon: (
                        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-sky-500">
                          <path
                            fill="currentColor"
                            d="M5.1 4C3.4 4 2 5.4 2 7.1c0 2.5 1.7 4.6 3.6 6.2 1.6 1.4 3.6 2.6 6.4 3.7 2.8-1.1 4.9-2.3 6.4-3.7 1.9-1.6 3.6-3.7 3.6-6.2C22 5.4 20.6 4 18.9 4c-1.2 0-2.2.6-3 1.5-.7.8-1.2 1.8-1.8 2.9-.3.6-.7 1.3-1.1 1.9-.4-.6-.8-1.3-1.1-1.9-.6-1.1-1.1-2.1-1.8-2.9C7.3 4.6 6.3 4 5.1 4Z"
                          />
                        </svg>
                      ),
                    },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3.5 py-2.5 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${link.iconBg}`}>
                        {link.icon}
                      </span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{link.label}</span>
                      <svg
                        className="ml-auto h-4 w-4 text-zinc-400"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Targeted Job Families</h2>
          <div className="mt-4">
            <JobFamiliesGrid />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Positions at {companyName || 'Company'}
          </h2>
          <div className="mt-4 space-y-6">
            {deals.length === 0 && (
              <div className="text-sm text-zinc-500">No jobs found for this company in pipeline ID “{pipelineId}”.</div>
            )}
            {deals.map((d) => {
              const attrs: any[] = d.attributes || []
              const priority: Record<string, number> = { green: 0, yellow: 1, grey: 2 }
              const sortByColor = (arr: any[]) => arr.sort((x, y) => (priority[x.fit_color] ?? 3) - (priority[y.fit_color] ?? 3))
              const byCat = {
                industry: sortByColor(attrs.filter((a) => a.category === 'industry')).slice(0, 5),
                process: sortByColor(attrs.filter((a) => a.category === 'process')).slice(0, 5),
                technical: sortByColor(attrs.filter((a) => a.category === 'technical')).slice(0, 5),
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
                      <div className="text-sm text-zinc-500">Text failed to load.</div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">Fit Summary</div>
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 min-h-24 whitespace-pre-wrap">
                        {typeof s?.fit_summary === 'string' && s.fit_summary.trim()
                          ? s.fit_summary
                          : 'Text failed to load.'}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <div className="h-full rounded-lg ring-1 ring-zinc-900/10 flex items-center justify-center p-4">
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Fit Score</div>
                          <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                            {s?.total_fit_percent != null ? `${Number(s.total_fit_percent).toFixed(0)}%` : '—'}
                          </div>
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

        <ReferralCTASection deals={deals} companyName={companyName} />
      </div>
    </Container>
  )
}
