import AboutHero from '@/app/about/AboutHero'
import Link from 'next/link'
import clsx from 'clsx'
import { Card } from '@/components/Card'
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
      <path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconAdvisory(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" {...props}>
      <path d="M12 3v4m0 10v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M3 12h4m10 0h4m-2.83-7.07-2.83 2.83M7.76 16.24 4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconCommunity(props: React.ComponentPropsWithoutRef<'svg'>) {
  // Network nodes icon
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" {...props}>
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="5" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="19" r="1.7" fill="currentColor" />
      <path d="M6.7 12h10.6M12 6.7v10.6M6.2 11l4.8-4.8M17.8 13l-4.8 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const techCopy: Record<string, string> = {
    'Platform': 'Foundational systems powering operations: Epic, SAP, SaaS, and cloud.',
    'Automation/AI': 'Streamlining workflows with batch jobs, RPA, and predictive intelligence.',
    'Integration': 'Connecting systems and data with APIs, middleware, and pipelines.',
    'Security': 'Protecting access, compliance, and data integrity across applications.',
    'Monitoring': 'Tracking performance, errors, and system health in real time.',
    'Reporting': 'Turning raw data into insights with dashboards and analytics.',
  }
  const areas = ['Platform', 'Automation/AI', 'Integration', 'Security', 'Monitoring', 'Reporting'] as const
  const areaParam = typeof searchParams?.tech === 'string' ? (searchParams!.tech as string) : undefined
  const selected = areas.includes((areaParam as any) ?? '') ? (areaParam as (typeof areas)[number]) : 'Platform'
  return (
    <>
      <AboutHero />
      <Container className="mt-8 sm:mt-12">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-pretty text-[#990000]">An Introduction, of Sorts</h2>
        <div className="mt-4 md:grid md:grid-cols-[63%_37%] md:gap-5">
          {/* Left: narrative copy */}
          <div className="text-pretty text-[16px] sm:text-[18px] leading-[1.7] sm:leading-[1.8] text-zinc-800 dark:text-zinc-200 space-y-4 md:space-y-5 md:max-w-[64ch] bg-[#f6f6f7] dark:bg-zinc-900/60 rounded-2xl px-6 sm:px-8 py-6 sm:py-8 shadow-sm ring-1 ring-zinc-200/60 dark:ring-white/10">
            <p>
              Welcome to <span className="font-semibold">allenwalker.info</span> — my personal portfolio bringing together the dynamic threads of my career, creative work, and future ambitions into one cohesive story of who I am and where I’m headed.
            </p>
            <p>
              I’m <Link href="/articles/exploring-whats-next" className="underline underline-offset-2 decoration-[#990000]/80 text-[#990000] hover:decoration-[#990000]">actively exploring my next role</Link> and open to collaborating with visionaries who share a passion for building what’s next. While this site centers on my journey, its purpose is connection. I want to spark conversations and connect with others who like to cause a bit of good trouble. The <em>system builders</em> remixing the status quo creating something better than what came before. The <em>organizers</em> who understand that change isn’t just about ideas, but the logistics and structure that make them real. The <em>researchers</em> and <em>developers</em> who see the world differently, and can’t help but make it better.
            </p>
            <p>
              I’d love to hear your story, your dreams, and what drives you. Whether you’re a recruiter filling a role, a hiring manager building a team, an entrepreneur seeking a partner, or simply someone inspired to say hi, you never know where the next conversation might lead.
            </p>
            <p>Thank you for stopping by. I’m glad you’re here.</p>
            <p className="italic text-right text-lg sm:text-xl text-zinc-900 dark:text-zinc-100">– Allen Walker</p>
          </div>
          {/* Right: quick links */}
          <div className="mt-6 space-y-3 md:mt-0 md:pl-2">
              {/* Resume remains primary */}
              <Card className="overflow-hidden bg-[#F6E6E6] shadow-sm ring-1 ring-[#e3caca] p-2 sm:rounded-lg dark:bg-[#351313] dark:ring-[#7c3b3b]">
                <Card.Title href="/about" className="text-[#990000] dark:text-[#f6e6e6]">Resume</Card.Title>
                <Card.Description compact className="text-[#6f2b2b] dark:text-[#f6dcdc]">Professional experience and background.</Card.Description>
                <Card.Cta href="/about" compact className="mt-1 !text-[#990000] dark:!text-[#f6e6e6]">View</Card.Cta>
              </Card>

              {/* Core practice areas */}
              <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200 p-2 sm:rounded-lg dark:bg-zinc-900 dark:ring-white/10">
                <Card.Title href="/program-delivery">Delivery</Card.Title>
                <Card.Description compact>Enterprise program delivery and transformation.</Card.Description>
                <Card.Cta href="/program-delivery" compact className="mt-1">Explore</Card.Cta>
              </Card>
              <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200 p-2 sm:rounded-lg dark:bg-zinc-900 dark:ring-white/10">
                <Card.Title href="/business-development">Growth</Card.Title>
                <Card.Description compact>Business development and customer success.</Card.Description>
                <Card.Cta href="/business-development" compact className="mt-1">Explore</Card.Cta>
              </Card>
              <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200 p-2 sm:rounded-lg dark:bg-zinc-900 dark:ring-white/10">
                <Card.Title href="/tech-stack">Technology</Card.Title>
                <Card.Description compact>Product engineering and management.</Card.Description>
                <Card.Cta href="/tech-stack" compact className="mt-1">Explore</Card.Cta>
              </Card>
              <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200 p-2 sm:rounded-lg dark:bg-zinc-900 dark:ring-white/10">
                <Card.Title href="/board-advisory">Advisory</Card.Title>
                <Card.Description compact>Founder mentorship and support.</Card.Description>
                <Card.Cta href="/board-advisory" compact className="mt-1">Explore</Card.Cta>
              </Card>

              {/* Storytelling assets */}
              <Card className="overflow-hidden bg-[#F6E6E6] shadow-sm ring-1 ring-[#e3caca] p-2 sm:rounded-lg dark:bg-[#351313] dark:ring-[#7c3b3b]">
                <Card.Title href="/projects" className="text-[#990000] dark:text-[#f6e6e6]">Projects</Card.Title>
                <Card.Description compact className="text-[#6f2b2b] dark:text-[#f6dcdc]">Personal projects and community development.</Card.Description>
                <Card.Cta href="/projects" compact className="mt-1 !text-[#990000] dark:!text-[#f6e6e6]">Explore</Card.Cta>
              </Card>
              <Card className="overflow-hidden bg-[#F6E6E6] shadow-sm ring-1 ring-[#e3caca] p-2 sm:rounded-lg dark:bg-[#351313] dark:ring-[#7c3b3b]">
                <Card.Title href="/articles" className="text-[#990000] dark:text-[#f6e6e6]">Articles</Card.Title>
                <Card.Description compact className="text-[#6f2b2b] dark:text-[#f6dcdc]">Thoughts on tech, growth, and life.</Card.Description>
                <Card.Cta href="/articles" compact className="mt-1 !text-[#990000] dark:!text-[#f6e6e6]">Read</Card.Cta>
              </Card>
          </div>
        </div>
      </Container>
      <Container className="mt-12 sm:mt-16">
        <section className="text-pretty text-zinc-900 dark:text-zinc-100">
          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#990000] dark:text-[#f6e6e6]">Let’s build what’s next together.</h3>
            <p className="text-[16px] sm:text-[18px] leading-[1.7]">
              I’m meeting with founders, hiring leaders, and collaborators who want to move quickly. If you’re exploring a role, partnering on a program, or simply want to swap ideas, I’d love to connect.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="https://calendly.com/allen-bayconnectors"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#990000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7d0000]"
              >
                Schedule time on Calendly
              </Link>
              <Link
                href="https://www.linkedin.com/in/allenhwalker/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[#990000] px-5 py-2.5 text-sm font-semibold text-[#990000] transition hover:bg-[#f7e3e3] dark:hover:bg-[#4b1e1e]"
              >
                Connect on LinkedIn
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}
