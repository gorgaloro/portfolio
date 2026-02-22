import { Container } from '@/components/Container'
import IndustryBreadth from '@/components/IndustryBreadth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { Button } from '@/components/Button'
import LogoExplorer from '@/components/LogoExplorer'

export const metadata = {
  title: 'Board Advisory',
  description:
    'I advise early-stage founders navigating product-market fit, operational scaling, and go-to-market execution. With a cross-industry background in tech, healthcare, and infrastructure — and a network spanning 2,000+ professionals across companies like Meta, Ford, and Kaiser — I help founders overcome blockers and accelerate at key inflection points.',
}

export default function BoardAdvisory() {
  const ctaBenefits = [
    'Advisory Calls – Book 1:1 coaching or strategy sessions by the hour',
    'Pitch & Materials Review – One-off deep-dives into your pitch deck, GTM plan, or investor collateral',
    'Sprint-Based Projects – Targeted deliverables over 2–6 week sprints',
    'Ongoing Advisory – Monthly support with recurring strategy calls, reviews, and async feedback',
    'Strategic Partnerships – Fractional leadership and hands-on execution for longer-term scaling',
  ]
  return (
    <>
      {/* Stats Hero */}
      <Container className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 lg:pb-12">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-zinc-100">
            Turning Vision Into Scale
          </h2>
          <p className="mt-4 text-lg/8 text-zinc-600 dark:text-zinc-400">
            Helping founders move faster with clarity, structure, and confidence.
          </p>
        </div>
        <dl className="mt-10 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Startups Launched</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              18
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Founders Mentored</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              25+
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Workshops Led</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              50+
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Network Connections</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              3k+
            </dd>
          </div>
        </dl>
      </Container>
      <Container className="py-12 sm:py-16 lg:py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Partnering With Founders to Build What’s Next
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 items-start lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="space-y-6 text-pretty text-base/7 text-zinc-600 dark:text-zinc-400">
            <p>
              <strong>Founders live in constant motion.</strong> They balance fundraising, hiring, product deadlines, and investor expectations while trying to build something that lasts. Every decision feels urgent. Every problem competes for attention. The noise is real, and it doesn’t stop.
            </p>
            <p>
              I know that rhythm because I’ve lived it. I’ve spent my career as a builder, a perpetual entrepreneur with 20 years of experience turning ideas into reality. From a college kid dismantling motorcycles on the side, to a tech leader launching enterprise products, to a community organizer solving problems close to home, I’ve always been driven to create. But I also know that no one builds alone. You need thought partners who strengthen your product and open new perspectives, investors to fund development, early customers to advocate on your behalf, and leadership teams who help turn momentum into scale.
            </p>
            <p>
              My focus now is helping founders build their vision into reality, turning ideas into products and workgroups into operational teams. I bring structure, clarity, and experience to help you move faster with confidence. Whether it’s refining your ideas, executing key deliverables, or opening the right doors, I’m here to help you build what’s next.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end lg:items-center">
            <img
              src="/images/founder_life.png"
              alt="Founder collaborating with advisory partner"
              className="h-auto w-[300px] object-contain"
            />
          </div>
        </div>
        <h2 className="mt-12 text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Advisory Deliverables
        </h2>
        <div className="mt-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex items-end">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Idea Validation & GTM
              </p>
            </div>
            <div className="flex items-end">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Product Development
              </p>
            </div>
            <div className="flex items-end">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Storytelling & Pitching
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-8 sm:grid-cols-3 text-pretty text-base text-zinc-600 dark:text-zinc-400">
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f8f6f233] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Founder Strategy Session</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Define goals, validate assumptions, and align early priorities.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f8f6f233] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Problem & Audience Validation</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Identify real customer pain and validate product–market fit.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f8f6f233] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Go-to-Market Roadmap</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Plan launch channels, milestones, and growth timelines.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f8f6f233] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Pitch Narrative Workshop</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Craft a story that wins investors and customers.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f8f6f233] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Early KPI Framework</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Set metrics to track traction and measure progress.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f5f7fa33] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">MVP Definition Sprint</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Distill your vision into a focused, testable product.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f5f7fa33] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Feature Prioritization Workshop</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Rank features by impact, effort, and customer value.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f5f7fa33] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Product Requirements Review</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Translate ideas into actionable specs and development plans.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f5f7fa33] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">UX & Workflow Design</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Design intuitive experiences that improve adoption and retention.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#f5f7fa33] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Release Planning Session</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Align teams, timelines, and deliverables for smooth launches.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-[#fbf7f533] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Founder Story Refinement</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Shape your personal journey into a compelling narrative.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#fbf7f533] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Investor Pitch Polish</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Tighten structure, flow, and visuals for maximum clarity.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#fbf7f533] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Product Messaging Framework</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Define what you do, who it’s for, and why it matters.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#fbf7f533] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Demo Script Development</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Craft clear, memorable demos that convert interest into action.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-[#fbf7f533] p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Brand Voice Alignment</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Ensure consistency across decks, websites, and outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container className="py-12 sm:py-16 lg:py-20">
        <h3 className="text-2xl font-semibold tracking-tight text-pretty text-zinc-900 dark:text-zinc-100">
          Connections that Make a Difference
        </h3>
        <div className="mt-4 space-y-4 text-pretty text-zinc-600 dark:text-zinc-400">
          <p>
            Over the past two decades, I’ve had the privilege of leading large-scale programs and partnerships with some of the world’s most recognized companies. From healthcare and biotech to enterprise tech and sustainability, I’ve worked inside and alongside organizations that shape industries.
          </p>
          <p>
            My connections are carefully curated from relationships built on trust, collaboration, and consistent delivery. Whether you need feedback from the field, insight from a specific market, or an introduction to the right decision-makers, I can help open the doors that move ideas forward.
          </p>
        </div>
        <div className="mt-6">
          {/* Interactive logo explorer with tag filters and pagination */}
          <LogoExplorer />
        </div>
      </Container>

      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto flex max-w-2xl flex-col gap-16 bg-white/75 px-6 py-16 shadow-lg ring-1 ring-zinc-900/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none xl:px-20 dark:bg-zinc-900/40 dark:ring-white/10">
              <div className="w-full">
                <h2 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-950 sm:text-5xl dark:text-zinc-50">
                  Let's Build Something
                </h2>
                <p className="mt-6 text-pretty text-lg/8 text-zinc-600 dark:text-zinc-400">
                  From one-time sessions to ongoing partnerships, I offer flexible engagement options designed to meet your stage, budget, and needs.
                </p>
                <ul
                  role="list"
                  className="mt-10 grid grid-cols-1 gap-y-3 text-base/7 text-zinc-950 dark:text-zinc-100"
                >
                  {ctaBenefits.map((benefit) => {
                    const parts = benefit.split(' – ')
                    const title = parts[0]
                    const rest = parts.slice(1).join(' – ')
                    return (
                      <li key={benefit} className="flex gap-x-3">
                        <CheckCircleIcon aria-hidden="true" className="h-7 w-5 flex-none text-indigo-500 dark:text-indigo-400" />
                        <span>
                          <span className="font-semibold">{title}</span>
                          {rest ? <> – {rest}</> : null}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-10 flex">
                  <Button href="https://calendly.com/allen-bayconnectors">
                    Book an intro call
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          >
            <div
              style={{
                clipPath:
                  'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
              }}
              className="aspect-[1318/752] w-[329.5px] flex-none bg-gradient-to-r from-[#9fd6fc] to-[#8680fd] opacity-50"
            />
          </div>
        </div>
      </Container>

    </>
  )
}
