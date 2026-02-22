import { Container } from '@/components/Container'

export default function AboutHero() {
  return (
    <section className="relative">
      <Container>
        <div className="relative py-10 sm:py-12 lg:py-14">
          <div className="grid items-center gap-x-8 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-6 pt-4">
              <h1 className="text-4xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-6xl dark:text-zinc-100">
                Building Systems.
                <br />
                Leading Change.
                <br />
                <span className="text-[#990000]">Chapter Two.</span>
              </h1>
              <p className="mt-8 text-lg font-medium text-pretty text-zinc-600 sm:text-xl dark:text-zinc-400">
                Tech leader with two decades of experience guiding organizations through transformation at the intersection of people, process, and technology. Entrepreneur. Tinkerer. Builder.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="relative h-[22rem] sm:h-[26rem] lg:h-[32rem]">
                <div className="absolute inset-0 overflow-hidden bg-zinc-50 [clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)] dark:bg-zinc-800">
                  <img
                    alt=""
                    src="/about-hero.jpg"
                    className="size-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
