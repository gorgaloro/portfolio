import { Container } from '@/components/Container'

function IconBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`size-10 grid place-items-center rounded-lg bg-white text-teal-600 shadow-sm ring-1 ring-zinc-200 dark:bg-white dark:text-teal-600 dark:ring-white/30 ${className}`}>
      {children}
    </div>
  )
}

function IconDelivery(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" {...props}>
      <path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconAdvisory(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" {...props}>
      <path d="M12 3v4m0 10v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M3 12h4m10 0h4m-2.83-7.07-2.83 2.83M7.76 16.24 4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCommunity(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" {...props}>
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="5" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="19" r="1.7" fill="currentColor" />
      <path d="M6.7 12h10.6M12 6.7v10.6M6.2 11l4.8-4.8M17.8 13l-4.8 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export const metadata = {
  title: 'Methodology That Meets the Moment — Execution',
  description:
    'Program delivery that translates strategy into results. 80+ go-lives, 1M+ end users, $1.4B in project budgets, and 135+ workstreams managed.',
  openGraph: {
    title: 'Methodology That Meets the Moment — Execution',
    description:
      'Program delivery that translates strategy into results. 80+ go-lives, 1M+ end users, $1.4B in project budgets, and 135+ workstreams managed.',
    type: 'website',
    images: ['/execution-graphic.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology That Meets the Moment — Execution',
    description:
      'Program delivery that translates strategy into results. 80+ go-lives, 1M+ end users, $1.4B in project budgets, and 135+ workstreams managed.',
    images: ['/execution-graphic.png'],
  },
}

const stats = [
  { id: 1, name: 'Go-Lives', value: '80+' },
  { id: 2, name: 'End Users', value: '1M+' },
  { id: 3, name: 'Project Budgets', value: '$1.4B' },
  { id: 4, name: 'Workstreams Managed', value: '135+' },
]

const capabilityColumns = [
  {
    name: 'Management',
    header: '/images/program-header.png',
    visual: '/images/program.png',
    alt: 'Program visual',
  },
  {
    name: 'Business Processes',
    header: '/images/business-header.png',
    visual: '/images/business.png',
    alt: 'Business visual',
  },
  {
    name: 'Technology',
    header: '/images/engineering-header.png',
    visual: '/images/technology.png',
    alt: 'Technology visual',
  },
  {
    name: 'People & Adoption',
    header: '/images/readiness-header.png',
    visual: '/images/adoption.png',
    alt: 'Adoption visual',
  },
  {
    name: 'Go-Live',
    header: '/images/activation-header.png',
    visual: '/images/activation.png',
    alt: 'Go-Live visual',
  },
]

const pmToolLogos = [
  { name: 'Airtable', logo: '/images/pm%20app%20logos/airtable.png' },
  { name: 'Asana', logo: '/images/pm%20app%20logos/asana.png' },
  { name: 'Confluence', logo: '/images/pm%20app%20logos/confluence.svg' },
  { name: 'Jira', logo: '/images/pm%20app%20logos/jira.png' },
  { name: 'Miro', logo: '/images/pm%20app%20logos/miro.png' },
  { name: 'Microsoft Project', logo: '/images/pm%20app%20logos/msproject.png' },
  { name: 'Notion', logo: '/images/pm%20app%20logos/notion.png' },
  { name: 'Power BI', logo: '/images/pm%20app%20logos/powerbi.png' },
  { name: 'ServiceNow', logo: '/images/pm%20app%20logos/servicenow.png' },
  { name: 'Smartsheet', logo: '/images/pm%20app%20logos/smartsheet.png' },
  { name: 'Tableau', logo: '/images/pm%20app%20logos/tableau.png' },
  { name: 'Trello', logo: '/images/pm%20app%20logos/trello.png' },
]

// Graphic rendered as static PNG from /public/execution-graphic.png

export default function ProgramDelivery() {
  return (
    <>
      {/* Stats: Trusted by creators */}
      <Container className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 lg:pb-12">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-zinc-100">
            Moving the Mission Forward
          </h2>
          <p className="mt-4 text-lg/8 text-zinc-600 dark:text-zinc-400">
            Bridging technology and business objectives through scalable program delivery.
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

      {/* Projects With Impact card */}
      <Container className="pt-8 sm:pt-10 lg:pt-12 pb-0">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-zinc-50 ring-1 ring-zinc-900/10 dark:from-white/10 dark:via-white/5 dark:to-white/0 dark:bg-none dark:ring-white/12">
          <div className="border-b border-zinc-200 bg-zinc-50/70 px-6 py-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Delivering Enterprise Transformation at Scale
            </h3>
            <p className="mt-1 text-sm italic text-zinc-600 dark:text-zinc-400">
              Delivering change through strategic leadership and human-centered transformation.
            </p>
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-8 grid-cols-[70%_30%] max-lg:grid-cols-1">
              <div className="space-y-4 text-lg/7 text-pretty text-zinc-700 dark:text-zinc-300">
                <p>
                  <span className="font-semibold">Technology moves fast.</span> I’ve seen it firsthand implementing electronic records that replaced paper charts and leading ERP upgrades that moved teams from spreadsheets to the cloud. Across industries, the outcome is the same: greater efficiency, better data, and less busywork.
                </p>
                <p>
                  <span className="font-semibold">But transformation isn’t just technical; it’s human.</span> I help teams navigate change with clarity, empathy, and structure, building systems that align people, process, and technology to prepare organizations for what’s next. These are methodologies I’ve refined through years of leading Fortune 100 programs and driving change within tech-forward organizations that are redefining how their industries operate.
                </p>
              </div>
              <div className="flex items-start justify-start px-2 sm:px-3 lg:px-4">
                <img
                  src="/images/orgransform.png"
                  alt="Organization transformation overview graphic"
                  className="h-auto max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-white/10">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
                Enterprise Delivery Portfolio
              </h4>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8 lg:grid-cols-5">
                {[
                  {
                    name: 'Ford',
                    logo: 'https://rvochvbcvvhdbglxpwbj.supabase.co/storage/v1/object/public/logos/3fb3e9ce-e544-4eab-b3e0-e84146bd9a6b.png?',
                  },
                  {
                    name: 'Amgen',
                    logo: 'https://rvochvbcvvhdbglxpwbj.supabase.co/storage/v1/object/public/logos/284e7050-6675-4efd-b12d-b9b62007dfbc.png?',
                  },
                  {
                    name: 'Kaiser',
                    logo: 'https://rvochvbcvvhdbglxpwbj.supabase.co/storage/v1/object/public/logos/a6452f26-48e9-48b2-859d-cd6a6cea7db1.png?',
                  },
                  {
                    name: 'Northwestern Medicine',
                    logo: 'https://rvochvbcvvhdbglxpwbj.supabase.co/storage/v1/object/public/logos/bed42d82-f36b-47b5-9d5f-021472c4ea9c.png?',
                  },
                  {
                    name: 'Cedars-Sinai',
                    logo: 'https://rvochvbcvvhdbglxpwbj.supabase.co/storage/v1/object/public/logos/98578e2e-8bad-4ce0-90e6-76afdf5d51ec.svg?',
                  },
                ].map(({ name, logo }) => (
                  <div key={name} className="flex h-14 items-center justify-center">
                    <img
                      src={logo}
                      alt={`${name} logo`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-10 w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* About/mission section */}
      <Container className="pt-10 sm:pt-12 lg:pt-14 pb-8 sm:pb-10 lg:pb-12">
        <div className="max-w-none">
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Project Methodology That Meets the Moment
          </h2>
          <p className="mt-6 text-xl/8 text-pretty text-zinc-700 dark:text-zinc-300">
            Every organization has its own rhythm, culture, and constraints. Successful delivery means meeting teams where they are. Whether launching a new venture, iterating on a product, or transforming enterprise systems at scale, I adapt the approach to fit the mission. My experience leading more than 80 go-lives across diverse industries has taught me how to match the right framework to each initiative, guiding teams through every project phase to deliver change on time, on budget, and to the highest quality standards.
          </p>
        </div>
      </Container>

      {/* Graphic (below hero). Clean, borderless rendering. */}
      <Container className="py-6 sm:py-8 lg:py-10">
        <div className="relative mx-auto max-w-full">
          <img
            src="/execution-graphic.png"
            alt="Methodology contexts and use-cases: Agile, Structured Agile, Waterfall, and Hybrid Agile."
            width={1000}
            height={400}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full max-w-[1000px] mx-auto"
          />
        </div>
      </Container>

      {/* Weaving section with capability columns */}
      <Container className="pt-4 sm:pt-6 lg:pt-8 pb-12">
        <div className="max-w-none">
          <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Weaving the Work Together
          </h2>
          <div className="mt-6 space-y-4 text-xl/8 text-pretty text-zinc-700 dark:text-zinc-300">
            <p>
              Large-scale programs succeed when complex work moves in sync. I’ve led more than 135 workstreams spanning management, business operations, engineering, and activation. My role is to bring it all together. I translate strategy into structure, connecting cross-functional teams so decisions, timelines, and dependencies stay aligned.
            </p>
            <p>
              Delivery is driven by clear communication and collaboration. Everyone knows what’s happening, blockers are addressed quickly, and teams stay focused on critical-path work so milestones and phase gates are met with confidence.
            </p>
          </div>
          <div className="mt-8 hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {capabilityColumns.map(({ name, header, visual, alt }) => (
              <div key={name} className="text-center">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  <img
                    src={header}
                    alt={name}
                    className="mx-auto h-auto max-w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </h3>
                <div className="mt-4">
                  <img
                    src={visual}
                    alt={alt}
                    className="mx-auto h-auto w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Modern PM Tooling grid */}
      <Container className="pt-4 sm:pt-6 lg:pt-8 pb-12">
        <div className="max-w-none">
          <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Project Management Tools That Power Delivery
          </h2>
          <div className="mt-6 space-y-4 text-xl/8 text-pretty text-zinc-700 dark:text-zinc-300">
            <p>
              Modern program management relies on visibility, communication, and accountability. I use a range of tools to plan, track, and report on work, selecting the right platform for each team and project.
            </p>
            <p>
              I build <span className="font-semibold">project plans and roadmaps</span> in MS Project, Smartsheet, or Asana, manage <span className="font-semibold">sprints and Kanban boards</span> in Jira or Trello, and maintain <span className="font-semibold">risk logs, RAIDs, and status reports</span> in Confluence or Notion. For analytics, I create <span className="font-semibold">dashboards</span> in Power BI or Tableau, integrating data from Airtable, ServiceNow, or Miro to surface insights and track progress.
            </p>
            <p>
              Together, these tools create alignment and transparency, keeping delivery on schedule and teams focused on results.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {pmToolLogos.map(({ name, logo }) => (
              <div
                key={name}
                className="flex h-20 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 p-4 dark:bg-zinc-900 dark:ring-zinc-700/60"
              >
                <img
                  src={logo}
                  alt={`${name} logo`}
                  className="max-h-12 w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>

    </>
  )
}
