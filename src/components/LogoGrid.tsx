import { getLogos, type LogoRecord } from '@/lib/logos'

export interface LogoGridProps {
  limit?: number
  table?: string
  select?: string
  className?: string
}

// Server component that fetches public logos from Supabase and renders a responsive grid
export default async function LogoGrid(props: LogoGridProps) {
  const logos: LogoRecord[] = await getLogos({
    limit: props.limit,
    table: props.table,
    select: props.select,
  })

  if (!logos || logos.length === 0) {
    return (
      <div className={props.className}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Logos will appear here once your Supabase env vars are configured and the table has data.</p>
      </div>
    )
  }

  return (
    <div className={props.className}>
      <ul className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {logos.map((item, idx) => {
          const id = (item.id as string | number | undefined) ?? `${idx}`
          const name = (item.name as string | undefined) ?? 'Company'
          const logoUrl = (item.logo_url as string | undefined) ?? ''
          const websiteUrl = (item.website_url as string | undefined) ?? ''

          if (!logoUrl) return null

          const logoImg = (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              loading="lazy"
              className="h-10 w-full object-contain opacity-80 transition hover:opacity-100 dark:opacity-90"
            />
          )

          return (
            <li key={id} className="flex items-center justify-center">
              {websiteUrl ? (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={name} className="block">
                  {logoImg}
                </a>
              ) : (
                logoImg
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
