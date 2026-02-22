import Image from 'next/image'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
// Using public image path for resume photo
// import avatar from '@/images/avatar.jpg'

export const metadata = {
  title: 'Resume',
  description: 'Experience and links for Allen Walker.',
}

export default function ResumePage() {
  // Add your experience items here. Fill in company, title, dates, etc.
  const experience: Array<{
    company: string
    title: string
    location?: string
    start: string
    end?: string
    bullets?: string[]
  }> = [
    {
      company: 'Bay Area Connectors',
      title: 'Founder & Organizer',
      start: '2024',
      end: 'Present',
      bullets: [
        'Founded and scaled a networking organization fostering innovation and professional growth across the SF Bay Area tech ecosystem.',
        'Organized monthly in-person events attracting technologists, investors, and founders; grew reach through strategic marketing.',
        'Built sponsorships and partnerships with high-impact stakeholders to deliver value-driven programming and collaboration.',
        'Directed event operations including logistics, speaker curation, and audience engagement; maintaining high satisfaction rates.',
        'Managed vision, operations, and sustainability while cultivating an inclusive, cross-sector professional community.',
      ],
    },
    {
      company: 'Ford Motor Company',
      title: 'Customer Experience Project Manager',
      start: '2022',
      end: '2024',
      bullets: [
        'Led EVSE deployment programs for Fortune 100 fleet clients—managing onboarding, coordination, and field execution to reduce fuel costs and emissions.',
        'Aligned with sales and RevOps teams to streamline deployment workflows, accelerate onboarding, and improve post-sale customer experience.',
        'Tracked customer data and deployment metrics in Salesforce—improving visibility across lead times, change orders, and install readiness.',
        'Collaborated closely with Customer Success Managers to identify process gaps, track escalations, and drive resolution of client-facing deployment issues.',
        'Provided on-site support and SaaS/hardware troubleshooting to ensure smooth installations and resolve issues in real time.',
        'Delivered customer insights to product teams—flagging field issues and proposing enhancements to improve experience and adoption.',
      ],
    },
    {
      company: 'Porchlight Inspection Services',
      title: 'Startup Founder & Construction Manager',
      start: '2019',
      end: '2022',
      bullets: [
        'Launched and ran a hands-on real estate services startup—delivering inspections, full-cycle property rehabs, and investor consulting services.',
        'Managed everything from architectural planning and permitting to swinging a hammer, pouring foundations, and coordinating subcontractors to get projects over the finish line.',
        'Led sales, deal sourcing, and business development—building a HubSpot 2,000+ contact network and converting investor leads into recurring revenue.',
        'Acted as construction manager for rehab projects—balancing timelines, budgets, and quality while solving daily execution challenges across multiple sites.',
        'Delivered high-trust client experiences through detailed inspections, clear reporting, and end-to-end visibility for homeowners and investors alike.',
        'Owned the digital presence—running SEO, content, and marketing strategy to drive lead generation and build brand credibility.',
      ],
    },
    {
      company: 'UC Davis',
      title: 'Release Manager',
      start: '2019',
      bullets: [
        'Oversaw Epic quarterly release cycles for self-pay workflows—reviewed release notes, validated functionality in test environments, secured business signoff, and ensured documentation and training readiness for go-live.',
        'Managed production support and enhancement backlogs—overhauled a disorganized registry of 100+ legacy items by reclassifying priorities and aligning issue resolution with revenue impact.',
        'Introduced agile-inspired backlog hygiene practices to replace arbitrary classifications with clear high/medium/low tiers, enabling clearer prioritization and delivery focus.',
        'Facilitated cross-functional issue triage and research coordination; organized operational leaders to support business-critical workflows.',
      ],
    },
    {
      company: 'Northwestern Medicine',
      title: 'Technical Project Manager',
      start: '2016',
      end: '2018',
      bullets: [
        'Led Epic PB/HB revenue cycle implementation across 8 hospitals and 30+ clinics—managing parallel workstreams, vendor coordination, and multi-phase system integration.',
        'Directed a cross-functional team of 30+ analysts, consultants, and contractors—driving delivery on schedule and within budget.',
        'Managed QA execution and defect resolution across integrated and UAT cycles—ensuring quality standards and alignment with business requirements ahead of go-live.',
        'Ran collaborative design workshops to define future-state billing workflows, establish cross-team alignment, and guide technical build execution.',
        'Delivered cutover planning and go-live execution across tiered deployment waves—minimizing operational disruption and accelerating adoption.',
        'Spearheaded automation of payment posting and reconciliation using custom logic in OnBase—integrating 26 systems (Epic, PeopleSoft, TrustCommerce) to reduce manual input and ensure data accuracy.',
        'Deployed charge edit automation strategy with Optum Claims Manager—cutting coding-related denials by 50%, reducing denials, and capturing additional revenue through intelligent error detection.',
        'Managed rapid deployment of 900+ credit card terminals across the health system—coordinated logistics, system configuration, and go-live in a 48-hour window.',
      ],
    },
    {
      company: 'Kaiser Permanente',
      title: 'Systems Architect',
      start: '2014',
      end: '2016',
      bullets: [
        'Architected and maintained Epic PB/HB configuration across 17 production environments—ensuring scalability, data integrity, and alignment with HIPAA, SOX, and GAAP-compliant billing standards.',
        'Designed and optimized system integrations between Epic PB, clinical, and financial platforms—enabling secure, audit-ready end-to-end workflows.',
        'Designed and implemented automated charge reconciliation processes—handling over 300k transactions per month.',
        'Built automation frameworks and reusable components in VBA and Epic Text—supporting enterprise reporting and reconciliation while reducing manual effort by 40+ hours/week.',
        'Developed Epic Text-based scripts for system health and maintenance—standardizing uptime monitoring and improving system reliability.',
        'Partnered with stakeholders to evaluate and implement 3M Computer-Assisted Coding—overseeing configuration, integration, and deployment into Epic workflows.',
      ],
    },
    {
      company: 'Kaiser Permanente',
      title: 'IT Application Manager',
      start: '2012',
      end: '2014',
      bullets: [
        'Owned ALM and production support for claims editing, submission, and adjudication systems—supporting $60B in annual revenue across 8 regions.',
        'Managed $4.4M annual budget across apps, vendor contracts, and production support programs—led hiring, RFPs, and SLA enforcement.',
        'Oversaw onshore/offshore support teams and incident response management—aligned with existing Epic EHR help desk operations.',
        'Directed 24 Claims Manager upgrades and go‑lives in 18 months—aligning infrastructure, training, and vendor delivery with ICD‑10 and compliance milestones.',
        'Led vendor relationships with Optum, Relay Health, Epic, and CSC—negotiated pricing, roadmap, and service performance.',
        'Engaged executives and front‑line teams to prioritize business needs—translating them into actionable technical and operational solutions.',
        'Managed and mentored 4 FTEs—established skill development tracks, retention plans, and cross‑training programs.',
      ],
    },
    {
      company: 'Kaiser Permanente',
      title: 'Revenue Cycle Project Manager',
      start: '2011',
      end: '2012',
      bullets: [
        'Managed implementation of Medicare Advantage Risk Adjustment systems and processes for regions—aligning Epic build and extract logic with CMS compliance requirements.',
        'Developed and maintained detailed project plans—managing timelines, stakeholder coordination, go‑live, and post‑implementation support.',
        'Led cross‑functional design sessions to align stakeholders on solution changes—captured clinical and billing workflows for system workflows and extract configuration.',
        'Tracked and resolved risks, issues, and change requests—collaborated with engineering and operations teams to proactively clear delivery roadblocks.',
      ],
    },
  ]

  const community: Array<{
    title: string
    org: string
    location?: string
    start: string
    end?: string
    description: string
  }> = [
    {
      title: 'Founder & Organizer',
      org: 'Bay Area Connectors',
      location: 'San Francisco, CA',
      start: '2024',
      end: 'Present',
      description:
        'Built and lead an active tech ecosystem community—connecting founders, operators, and investors through curated in-person events. Cultivate strategic sponsorships, moderate panels, and drive relationship-building across the Bay Area startup scene.',
    },
    {
      title: 'League Commissioner',
      org: 'River City NABA',
      location: 'Sacramento, CA',
      start: '2022',
      end: '2024',
      description:
        'Supported operations for a 300+ player adult baseball league—managing scheduling, team formation, rules enforcement, player disputes, and strategic planning. Participated in board meetings, coordinated field usage across multiple parks, and helped sustain a strong, inclusive player experience. Led marketing and recruitment efforts to grow league membership and fill team rosters across divisions.',
    },
    {
      title: 'Founder & Executive Director',
      org: 'JobGroup (501c3)',
      location: 'Portland, OR',
      start: '2012',
      end: '2015',
      description:
        'Launched and scaled a nonprofit career development community serving 1,000+ professionals with peer coaching, skills workshops, and strategic job search guidance. Designed curriculum, led seminars, and oversaw marketing, finance, and community partnerships.',
    },
    {
      title: 'Board Member – Director of Communications',
      org: 'PMI Los Angeles Chapter',
      start: '2008',
      end: '2009',
      description:
        'Served on the Board of Directors for one of the largest PMI chapters in the country. Oversaw chapter-wide strategic planning initiatives, drove member engagement through targeted programming, and contributed to long-range planning efforts for the professional development of 3,000+ members.',
    },
  ]

  const additional: Array<{
    title: string
    org?: string
    location?: string
    start: string
    end?: string
    bullets?: string[]
  }> = [
    {
      title: 'Program & Project Management',
      org: 'Amgen, Cedars‑Sinai Medical Center',
      start: '2008',
      end: '2010',
      bullets: [
        'Managed 15+ workstreams in a global SAP drug manufacturing system replacement—tracking timelines, budgets, and risk escalations for executive review.',
        'Led revision of 2,000+ SOPs and job aids impacted by legacy MES transition—hired technical writers and coordinated documentation with LMS for 15,000+ users.',
        'Oversaw 26 cross‑functional workstreams in an Epic EMR rollout across 200+ team members—managed a 3,500+ line project plan and tracked contractor spend and onboarding.',
        'Developed and maintained custom SharePoint portals and status dashboards to support large‑scale stakeholder communication and project tracking.',
      ],
    },
    {
      title: 'Leasing Manager & Property Operations',
      location: 'Los Angeles',
      start: '2003',
      end: '2008',
      bullets: [
        'Closed over 100 residential leases as leasing manager of a 314-unit new construction high-rise—led a team of 3 agents and coordinated full-cycle leasing and tenant onboarding',
        'Managed daily operations for a 130-unit downtown building—oversaw rent collection, maintenance workflows, and leasing activities using Yardi',
        'Supported renters through complex searches—qualifying leads, matching renters to units, and coordinating tours across properties throughout LA and Seattle',
      ],
    },
  ]

  return (
    <Container className="mt-10 sm:mt-14">
      <Card hoverOverlay={false} className="overflow-hidden bg-white shadow-sm sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[260px_1fr]">
          {/* Photo */}
          <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Image
              src="/images/allen_headshot.png"
              alt="Allen Walker"
              width={800}
              height={800}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          {/* Name + meta + links */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Allen Walker
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              San Francisco, CA · linkedin.com/in/allenhwalker
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="https://www.linkedin.com/in/allenhwalker" variant="primary">
                Contact on LinkedIn
              </Button>
              <Button href="https://substack.com/@bayconnectors" variant="primary" className="bg-violet-600 hover:bg-violet-500">
                Follow on Substack
              </Button>
              <Button href="/Allen-Walker-Resume.pdf" variant="secondary">
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Summary */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Summary</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Project and technology leader with deep experience in enterprise systems, SaaS deployments, and startup growth. Skilled at bridging business strategy with technical execution, from launching new ventures to delivering regulated healthcare systems at scale. Brings an adaptable toolkit that spans program management, revenue operations, and engineering leadership.
        </p>
      </Card>

      {/* Skills & Expertise */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Skills & Expertise</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Business & Strategy</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Program Management, Revenue Operations, GTM Strategy, Change Management, Operations, Business Development</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Customer Experience & Delivery</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Customer Success, CX Ops, Cross-functional Program Delivery</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">CRM & Systems</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Salesforce, HubSpot, Epic (Resolute PB/HB), SAP, Yardi</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Planning & Documentation Tools</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">MS Project, Asana, Jira, Confluence, Notion, Smartsheet, Airtable, Miro, GitHub, Google Workspace, SharePoint</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI/ML & Automation</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">SQL, PostgreSQL, Supabase, VBA, Python, R, Data Modeling, Entity Relationship Design</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Execution & Ops</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Post-Sale Delivery Management, Solution Implementation, QA/UAT, Cutover Planning, Release Cycles, Prod Support, ALM</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Community & Ecosystem Building</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Strategic Events, Sponsorship Development, Stakeholder Engagement, CRM/Email Campaigns</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Industries</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">SaaS, AI, EV Infrastructure, Healthcare, Pharma, Real Estate, Construction, Property Management</p>
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Methodologies</h3>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Agile, Scrum, Waterfall, ITIL, Lean</p>
          </div>
        </div>
      </Card>

      {/* Experience */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Professional Experience</h2>
          </div>
        </div>
        <ol className="mt-4 space-y-6">
          {experience
            .filter(
              (role) => !(
                role.company === 'Amgen, Cedars‑Sinai Medical Center' &&
                role.title === 'Early Career Roles – Program & Project Management'
              )
            )
            .map((role, idx) => (
              <li key={`${role.company}-${idx}`} className="rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{role.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {role.company}{role.location ? ` • ${role.location}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {role.end ? `${role.start} — ${role.end}` : role.start}
                  </div>
                </div>
                {role.bullets && role.bullets.length > 0 && (
                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {role.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ol>
      </Card>

      {/* Additional Experience */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Additional Experience</h2>
          </div>
        </div>

        <ol className="mt-4 space-y-6">
          {additional.map((item, idx) => (
            <li key={`${item.title}-${idx}`} className="rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {item.org ?? ''}{item.org && item.location ? ' • ' : ''}{item.location ?? ''}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.start} — {item.end ?? 'Present'}
                </div>
              </div>
              {item.bullets && item.bullets.length > 0 && (
                <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Card>

      {/* Community Leadership & Networks */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Community Leadership & Networks</h2>
          </div>
        </div>

        <ol className="mt-4 space-y-6">
          {community.map((role, idx) => (
            <li key={`${role.org}-${idx}`} className="rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {role.title} — {role.org}
                  </h3>
                  {role.location && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{role.location}</p>
                  )}
                </div>
                <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {role.start} — {role.end ?? 'Present'}
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{role.description}</p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Education & Certifications */}
      <Card
        hoverOverlay={false}
        className="mt-6 overflow-hidden bg-white sm:rounded-2xl p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900"
      >
        <div className="relative -mx-6 -mt-6 self-stretch">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 rounded-t-2xl bg-zinc-100/70 dark:bg-white/5" />
          <div className="relative z-20 flex w-full h-14 items-center px-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Education & Certifications</h2>
          </div>
        </div>

        <ul className="mt-4 ml-5 list-disc space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">MBA – Entrepreneurialism</strong>
            <span className="text-zinc-600 dark:text-zinc-400"> — California State University, Fullerton</span>
          </li>
          <li>
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">BA – Economics & East Asian Languages and Cultures</strong>
            <span className="text-zinc-600 dark:text-zinc-400"> — University of Southern California</span>
          </li>
          <li>
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">Certifications:</strong>
            <span className="text-zinc-600 dark:text-zinc-400"> ITIL Foundations (v3), Epic Resolute PB & HB (Expired)</span>
          </li>
        </ul>
      </Card>
    </Container>
  )
}
