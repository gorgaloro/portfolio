import { Container } from '@/components/Container'
import { Section } from '@/components/Section'

export const metadata = {
  title: 'Referral Template',
  description: 'Base template for referral pages',
}

export default function ReferralTemplatePage() {
  return (
    <Container className="mt-10 sm:mt-14">
      <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-900/5 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Referral Template</h1>
      </div>

      <div className="mt-10 space-y-12">
        <Section title="Jobs I’m Targeting">
          <div className="h-0" />
        </Section>

        <Section title="Jobs at Company">
          <div className="h-0" />
        </Section>

        <Section title="Call to Action">
          <div className="h-0" />
        </Section>
      </div>
    </Container>
  )
}
