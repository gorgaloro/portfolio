import type { ReactNode } from 'react'

import { Container } from '@/components/Container'

export function SimpleLayout({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children?: ReactNode
}) {
  const introContent =
    typeof intro === 'string' || typeof intro === 'number' || intro === undefined
      ? intro
      : intro

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-none">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          {title}
        </h1>
        {typeof introContent === 'string' || typeof introContent === 'number' ? (
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">{introContent}</p>
        ) : (
          <div className="mt-6 text-base text-zinc-600 dark:text-zinc-400">{introContent}</div>
        )}
      </header>
      {children && <div className="mt-16 sm:mt-20">{children}</div>}
    </Container>
  )
}
