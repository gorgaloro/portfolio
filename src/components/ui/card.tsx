import * as React from 'react'
import clsx from 'clsx'

export type CardProps = React.HTMLAttributes<HTMLDivElement>
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-900/10 shadow-sm dark:bg-zinc-900/30 dark:ring-white/10',
        className,
      )}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={clsx('p-6', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-6 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        'text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100',
        className,
      )}
      {...props}
    />
  )
}
