import { Container } from '@/components/Container'

export const metadata = {
  title: 'Community Organizer',
  description:
    'Builds high-trust ecosystems that connect founders, talent, and ideas. Designs programs and platforms that inspire engagement, foster meaningful connection, and enable strategic partnerships.',
}

export default function CommunityOrganizer() {
  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      <div className="grid items-center gap-x-8 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-8 pt-4">
          <h1 className="text-5xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-7xl dark:text-zinc-100">
            Community
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty text-zinc-600 sm:text-xl/8 dark:text-zinc-400">
            Builds high-trust ecosystems that connect founders, talent, and ideas. Designs programs and platforms that inspire engagement, foster meaningful connection, and enable strategic partnerships.
          </p>
        </div>
        <div className="hidden lg:col-span-4 lg:block">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-900/10 dark:bg-zinc-800 dark:ring-white/10 h-[500px]">
            <img
              alt="Community visual"
              src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
              className="h-full w-full object-cover object-left"
            />
          </div>
        </div>
      </div>
    </Container>
  )
}
