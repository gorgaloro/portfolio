import Link from 'next/link'
import clsx from 'clsx'

function ChevronRightIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.75 5.75 9.25 8l-2.5 2.25"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Card<T extends React.ElementType = 'div'>({
  as,
  className,
  children,
  hoverOverlay = true,
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'> & {
  as?: T
  className?: string
  hoverOverlay?: boolean
}) {
  let Component = as ?? 'div'

  return (
    <Component
      className={clsx(className, 'group relative flex flex-col items-start')}
    >
      {/* Card-wide hover overlay */}
      {hoverOverlay && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-lg bg-zinc-50/80 opacity-0 transition group-hover:opacity-100 sm:rounded-lg dark:bg-zinc-800/50" />
      )}
      {children}
    </Component>
  )
}

Card.Link = function CardLink({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <>
      {/* Retain link overlay for focus/hover on the link itself (kept below the card-wide overlay) */}
      <div className="absolute inset-0 z-0 rounded-lg bg-transparent" />
      <Link {...props}>
        <span className="absolute -inset-x-4 -inset-y-6 z-30 sm:-inset-x-6 sm:rounded-2xl" />
        <span className="relative z-20">{children}</span>
      </Link>
    </>
  )
}

Card.Title = function CardTitle<T extends React.ElementType = 'h2'>({
  as,
  href,
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'href'> & {
  as?: T
  href?: string
}) {
  let Component = as ?? 'h2'

  return (
    <Component
      className={clsx(
        'relative z-20 font-semibold tracking-tight text-zinc-800 dark:text-zinc-100',
        'text-base',
        className,
      )}
      {...props}
    >
      {href ? <Card.Link href={href}>{children}</Card.Link> : children}
    </Component>
  )
}

Card.Description = function CardDescription({
  children,
  className,
  compact = false,
}: {
  children: React.ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <p
      className={clsx(
        'relative z-20 text-zinc-600 dark:text-zinc-400',
        compact ? 'mt-1 text-[13px] leading-5' : 'mt-2 text-sm',
        className,
      )}
    >
      {children}
    </p>
  )
}

Card.Cta = function CardCta({
  children,
  href,
  compact = false,
  className,
}: {
  children: React.ReactNode
  href?: string
  compact?: boolean
  className?: string
}) {
  const base = clsx(
    'relative z-20 flex items-center text-sm font-medium text-teal-500',
    compact ? 'mt-2' : 'mt-4',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
        <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current" />
      </Link>
    )
  }

  return (
    <div aria-hidden="true" className={base}>
      {children}
      <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current" />
    </div>
  )
}

Card.Eyebrow = function CardEyebrow<T extends React.ElementType = 'p'>({
  as,
  decorate = false,
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'decorate'> & {
  as?: T
  decorate?: boolean
}) {
  let Component = as ?? 'p'

  return (
    <Component
      className={clsx(
        className,
        'relative z-10 order-first mb-3 flex items-center text-sm text-zinc-400 dark:text-zinc-500',
        decorate && 'pl-3.5',
      )}
      {...props}
    >
      {decorate && (
        <span
          className="absolute inset-y-0 left-0 flex items-center"
          aria-hidden="true"
        >
          <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
        </span>
      )}
      {children}
    </Component>
  )
}
