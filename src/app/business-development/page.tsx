import { Container } from '@/components/Container'

export const metadata = {
  title: 'Growth',
  description:
    "Managed post-sale delivery and customer success for Ford’s EV infrastructure clients. Bridged product, operations, and customer teams to ensure scalable rollout and consistently high satisfaction.",
}

export default function BusinessDevelopmentPage() {
  return (
    <>
      {/* Stats Hero */}
      <Container className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 lg:pb-12">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-5xl dark:text-zinc-100">
            Powering the Revenue Engine
          </h2>
          <p className="mt-4 text-lg/8 text-zinc-600 dark:text-zinc-400">
            Architecting high-performing GTM and customer success systems that accelerate growth.
          </p>
        </div>
        <dl className="mt-10 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Products Launched</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              20+
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">Demos Delivered</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              2k+
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">User Growth Achieved</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              10x
            </dd>
          </div>
          <div className="flex flex-col bg-zinc-400/5 p-8 dark:bg-white/5">
            <dt className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400">AI Agents Created</dt>
            <dd className="order-first text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              100+
            </dd>
          </div>
        </dl>
      </Container>

      <Container className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Growth Built on Connection and Continuity
          </h2>
          <div className="mt-4 space-y-4 text-lg/8 text-pretty text-zinc-700 dark:text-zinc-300">
            <p>
              Revenue scales when every part of the customer journey stays in sync. When product development, business development, solution delivery, and customer experience align, adoption accelerates. Across more than 20 product launches, I’ve seen how coordinated execution builds momentum, while poorly executed initiatives stall.
            </p>
            <p>
              Growth isn’t just about closing deals; it’s about aligning every input so customers realize lasting value.
            </p>
          </div>
          <div className="mt-8">
            <img
              src="/images/revenuechain.png"
              alt="Revenue lifecycle from sales cycle to customer journey"
              className="w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            GTM Strategy &amp; Planning
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Where Vision Meets Market
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div className="relative">
              <img
                src="/images/gtmstrategy.png"
                alt="GTM strategy framework overview"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-3 text-base/7 text-pretty text-zinc-700 dark:text-zinc-300">
              <p>
                A great product isn’t enough. It has to meet the market at the right time, at the right price, with the right story. My background in economics and entrepreneurial management gives me both perspectives: how markets behave and what it takes to build within them.
              </p>
              <p>
                I understand that strategy is more than theory; it’s execution. I’ve launched ventures, helped others grow theirs, and seen how the right combination of market insight, positioning, and timing turns potential into traction. I focus on the fundamentals that turn ideas into scalable products that drive adoption and sustained growth.
              </p>
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            GTM Engineering
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Turning Data Into Leverage
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div className="relative">
              <img
                src="/images/gtmengineering.png"
                alt="GTM engineering workflow visual"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-3 text-base/7 text-pretty text-zinc-700 dark:text-zinc-300">
              <p>
                Growth doesn’t come from guessing; it comes from understanding. I create systems that turn information into action, connecting data, tools, and teams so every decision compounds and every interaction moves the business forward.
              </p>
              <p>
                Through modern CRM architectures and AI workflows, I’ve built enrichment pipelines that score leads, detect intent, and automate outreach. I’ve developed over 100 AI agents to do just that—creating systems that reduce friction, surface opportunities sooner, and keep sales and marketing teams focused on conversations that convert.
              </p>
              <p>
                Data becomes meaningful when it informs action. The systems I build simplify the complex, creating clarity from chaos.
              </p>
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Sales Engineering
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Demos Into Deals
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div className="relative">
              <img
                src="/images/salesengineering.png"
                alt="Sales engineering journey visual"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-3 text-base/7 text-pretty text-zinc-700 dark:text-zinc-300">
              <p>
                Deals happen when solutions pop. Connecting real customer needs to product capabilities is where I thrive. My focus is helping customers see how technology fits into their world, solves their problems, and scales with their goals.
              </p>
              <p>
                With a background in solution delivery and enterprise systems, I bring technical depth and architectural discipline. I ensure solutions align with business needs, integrations are viable, and delivery is grounded in reality. A trusted technical partner to both customers and sales, I bring insight, structure, and confidence to every deal.
              </p>
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10 lg:mt-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Customer Success
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Retention Is Growth
          </h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[400px_1fr] items-start">
            <div className="relative">
              <img
                src="/images/customersuccess.png"
                alt="Customer success lifecycle visual"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-3 text-base/7 text-pretty text-zinc-700 dark:text-zinc-300">
              <p>
                Revenue growth doesn’t end at acquisition. It scales when customers find real value in the products they use. Across startups and Fortune 100 enterprises alike, I’ve designed customer success programs that align product, engineering, and support teams around measurable value — increasing retention, accelerating time-to-value, improving customer health scores, and expanding net revenue retention.
              </p>
              <p>
                Customer success is more than a cost center. It connects customers to the product, fuels feedback that drives innovation, and ensures sustainable long-term growth.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {false && (
        <Container className="py-10 sm:py-12 lg:py-16">
          <div className="grid items-center gap-x-8 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-8 pt-4">
              <h1 className="text-5xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-7xl dark:text-zinc-100">
                Growth
              </h1>
              <p className="mt-8 text-lg font-medium text-pretty text-zinc-600 sm:text-xl/8 dark:text-zinc-400">
                Managed post-sale delivery and customer success for Ford’s EV infrastructure clients. Bridged product, operations, and customer teams to ensure scalable rollout and consistently high satisfaction.
              </p>
            </div>
            <div className="hidden lg:col-span-4 lg:block">
              <div className="relative overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-900/10 dark:bg-zinc-800 dark:ring-white/10 h-[500px]">
                <img
                  alt="App screenshot"
                  src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
                  className="h-full w-full object-cover object-left"
                />
              </div>
            </div>
          </div>
        </Container>
      )}
    </>
  )
}
