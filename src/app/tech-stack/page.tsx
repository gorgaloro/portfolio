import type { Metadata } from 'next'
import Link from 'next/link'
import clsx from 'clsx'
import path from 'node:path'
import fs from 'node:fs/promises'
import { Container } from '@/components/Container'

export const metadata: Metadata = {
  title: 'Technology',
  description:
    'A concise look at the technologies, frameworks, and tools I use to build products.',
}

// Ensure Node.js runtime for fs access and dynamic rendering for ?area=
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Skill = {
  skill: string
  description: string
  area: string
  application: string
  rank: number
}

function parseCSV(text: string): Skill[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length <= 1) return []
  const rows: Skill[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)
    if (fields.length < 5) continue
    const [skill, description, area, application, rankStr] = fields.map((s) => s.trim())
    const rank = Number(rankStr)
    rows.push({ skill, description, area, application, rank: Number.isFinite(rank) ? rank : 999 })
  }
  return rows
}

async function getSkills(): Promise<Skill[]> {
  try {
    const filePath = path.join(process.cwd(), 'tech_stack.csv')
    const text = await fs.readFile(filePath, 'utf8')
    return parseCSV(text)
  } catch {
    return []
  }
}

export default async function TechStackPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const skills = await getSkills()
  const allAreas = Array.from(new Set(skills.map((s) => s.area))).sort()
  const defaultArea = allAreas.includes('Security') ? 'Security' : allAreas[0]
  const params = await searchParams
  const areaParam = typeof params?.area === 'string' ? (params.area as string) : undefined
  const area = allAreas.includes(areaParam || '') ? (areaParam as string) : defaultArea

  const appOrder = ['Epic EHR', 'SAP', 'SaaS']
  const appsInArea = Array.from(new Set(skills.filter((s) => s.area === area).map((s) => s.application)))
  const apps = [...appsInArea].sort((a, b) => {
    const ia = appOrder.indexOf(a)
    const ib = appOrder.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  // Desired left-to-right order for tabs
  const desiredAreaOrder = ['Platform', 'Automation/AI', 'Integration', 'Security', 'Monitoring', 'Reporting']
  const areaTabs: string[] = [...allAreas].sort((a, b) => {
    const ia = desiredAreaOrder.indexOf(a)
    const ib = desiredAreaOrder.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  // Optional subheadings beneath each application title
  const appSubhead: Record<string, string> = {
    'Epic EHR': 'Kaiser, Northwestern, UC Davis',
    'SAP': 'Amgen',
    'SaaS': 'Ford, Projects',
  }

  const byApp = (app: string) =>
    skills
      .filter((s) => s.area === area && s.application === app)
      .sort((a, b) => a.rank - b.rank)

  const stats = [
    { id: 1, name: 'Apps Managed', value: '41+' },
    { id: 2, name: 'Engineers Directed', value: '400+' },
    { id: 3, name: 'Transactions Processed', value: '$200B+' },
    { id: 4, name: 'Environments Supported', value: '50+' },
  ]

  return (
    <>
      {/* Stats: Trusted by creators */}
      <Container className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 lg:pb-12">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-zinc-100">
            Delivering Technology at Scale
          </h2>
          <p className="mt-4 text-lg/8 text-zinc-600 dark:text-zinc-400">
            Engineering reliability across platforms, products, and teams.
          </p>
        </div>
        <dl className="mt-10 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
              <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">{stat.name}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
      {/* Product */}
      <Container className="pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Product Management
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Turning Vision Into Value
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div>
              <img
                src="/images/product_process.png"
                alt="Product Process"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4 text-base text-zinc-600 dark:text-zinc-400">
              <p>
                Great products begin with clear intent. My approach to product management connects vision to value—first defining the problem, then validating opportunities, and translating ideas into solutions that enhance end-user workflows.
              </p>
              <p>
                My experience managing full product lifecycles across enterprise and startup environments allows me to balance structure with agility. I design systems for feedback, iteration, and continuous improvement, ensuring technology, business, and users move forward together.
              </p>
              <p>
                User-centric product management extends beyond shipping features. Delivering functionality demands excellence in training, release management, change control, and post-iteration evaluation. I view every product as a living system—something to be evolved, not static code or process resistant to change.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Technology in Action */}
      <Container className="pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Engineering
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Designing for Reliability and Scale
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div>
              <img
                src="/images/itil_service.png"
                alt="ITIL Service"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4 text-base text-zinc-600 dark:text-zinc-400">
              <p>
                Managing technology at scale requires structured frameworks and forward-looking design. It starts with clear objectives, well-architected solutions, and alignment between applications, workflows, and business goals.
              </p>
              <p>
                Support and sustainability are equally vital. Systems often meet project targets but falter under production data, edge cases, and complex integrations. These realities demand foresight, resilience, and disciplined design.
              </p>
              <p>
                I bring experience on both sides of delivery. I’ve led enterprise change initiatives and personally stabilized failing systems under pressure. This dual perspective helps me anticipate challenges, design for durability, and guide teams toward solutions that last.
              </p>
            </div>
          </div>
        </div>
      </Container>


      {/* Tabs + 3-column grid from CSV */}
      <Container className="py-8 sm:py-10 lg:py-12">
        <div className="not-prose">
          {/* Section heading */}
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Enterprise Technology
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Orchestrating Systems at Scale
            </h2>
            <div className="mt-6 space-y-4 text-base/7 text-pretty text-zinc-600 dark:text-zinc-400">
              <p>
                Large-scale systems don’t run on code alone. Every application, environment, integration point, data center, platform, and process must align for enterprise technology to perform reliably at scale.
              </p>
              <p>
                Across 135+ workstreams and 400+ engineers, I’ve architected and managed ecosystems where data, infrastructure, and user experience intersect. From EHR and SAP to modern SaaS and AI automation, I understand how individual components connect to create a cohesive operational whole—and when issues arise, how to diagnose, stabilize, and restore performance under pressure.
              </p>
              <p>
                From designing production support playbooks to leading enterprise transformations, managing release cycles, and recovering from large-scale outages, I’ve built and rebuilt systems that stand up to real-world demands.
              </p>
            </div>
          </div>
          {/* Area tabs */}
          <div className="mb-6 hidden sm:block">
            <div className="flex w-full items-center rounded-full bg-white/90 px-1 py-0 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
              <ul className="flex w-full items-center h-10 rounded-full bg-black text-white px-2 py-1 overflow-hidden">
                {areaTabs.map((a) => (
                  <li key={a} className="flex-1">
                    <Link
                      scroll={false}
                      href={`/tech-stack?area=${encodeURIComponent(a)}`}
                      className={clsx(
                        'relative flex w-full items-center justify-center whitespace-nowrap rounded-full px-5 py-1.5 leading-none transition',
                        a === area ? 'bg-zinc-600/70 text-white' : 'text-white/80 hover:text-white',
                      )}
                    >
                      {a}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3-column grid grouped by application */}
          <div className="hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const list = byApp(app)
              if (list.length === 0) return null
              return (
                <section
                  key={app}
                  className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-900/10 dark:bg-zinc-900/40 dark:ring-white/10"
                >
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{app}</h3>
                  {appSubhead[app] && (
                    <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">{appSubhead[app]}</p>
                  )}
                  <ul className="mt-4 space-y-3">
                    {list.map((item) => (
                      <li key={`${app}-${item.rank}-${item.skill}`}>
                        <div className="w-full rounded-xl bg-white px-3 py-1.5 text-xs leading-tight text-zinc-800 ring-1 ring-zinc-900/10 transition hover:bg-zinc-50 dark:bg-white/5 dark:text-zinc-100 dark:ring-white/10 dark:hover:bg-white/10">
                          {item.skill}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      </Container>

    </>
  )
}
