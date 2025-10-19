import React from 'react'

export function Feature({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="h-full rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-900/10 p-6 shadow-sm dark:bg-zinc-900/30 dark:ring-white/10">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}

export function FeatureGrid({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section>
      {title && (
        <h2 className="text-3xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-4xl dark:text-zinc-100">
          {title}
        </h2>
      )}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {React.Children.map(children, (child, i) => (
          <div key={i}>{child}</div>
        ))}
      </div>
    </section>
  )
}
