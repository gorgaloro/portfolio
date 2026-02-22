"use client"

import { useEffect, useMemo, useState } from 'react'

interface CompanyItem {
  id?: string | number
  name: string
  logo: string
  website?: string
  tags?: string[]
}

const PAGE_SIZE = 20 // 5 x 4

export default function LogoExplorer() {
  const [tags, setTags] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('All')
  const [items, setItems] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)

  // Fetch tags once
  useEffect(() => {
    let cancelled = false
    async function loadTags() {
      try {
        const res = await fetch('/api/company-tags', { next: { revalidate: 1800 } })
        const { tags: fetched = [] } = (await res.json()) as { tags: string[] }
        if (cancelled) return
        const unique = Array.from(new Set(fetched)).sort((a, b) => a.localeCompare(b))
        setTags(['All', ...unique])
      } catch {
        if (!cancelled) setTags(['All'])
      }
    }
    loadTags()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch logos whenever tag changes
  useEffect(() => {
    let cancelled = false
    async function loadItems() {
      setLoading(true)
      setError(null)
      setPage(0)
      try {
        const qp = new URLSearchParams()
        if (selected) qp.set('tag', selected)
        qp.set('limit', '5000')
        const res = await fetch(`/api/company-logos?${qp.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { items: fetched = [] } = (await res.json()) as { items: CompanyItem[] }
        if (cancelled) return
        const key = (n: string) => (n || '').trim().toLowerCase().replace(/^(the|a|an)\s+/, '')
        const sorted = [...fetched].sort((a, b) => key(a.name).localeCompare(key(b.name)))
        setItems(sorted)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load logos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadItems()
    return () => {
      cancelled = true
    }
  }, [selected])

  const pages = useMemo(() => {
    const list: CompanyItem[][] = []
    for (let i = 0; i < items.length; i += PAGE_SIZE) list.push(items.slice(i, i + PAGE_SIZE))
    return list
  }, [items])

  const current = pages[page] ?? []
  const totalPages = pages.length || 1

  function prevPage() {
    setPage((p) => Math.max(0, p - 1))
  }

  function nextPage() {
    setPage((p) => Math.min(totalPages - 1, p + 1))
  }

  return (
    <div className="space-y-6">
      {/* Tag chips */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {tags.map((t) => {
          const active = t === selected
          return (
            <button
              key={t}
              type="button"
              onClick={() => setSelected(t)}
              className={
                `whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition shadow-sm ` +
                (active
                  ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:bg-zinc-800')
              }
              aria-pressed={active}
            >
              {t}
            </button>
          )
        })}
      </div>



      {/* Grid with side arrows */}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <div className="flex items-stretch gap-4">
          {/* Left rail */}
          {totalPages > 1 && (
            <div className="hidden sm:flex self-stretch">
              <button
                type="button"
                onClick={prevPage}
                disabled={page === 0}
                aria-label="Previous page"
                className="w-10 md:w-12 self-stretch rounded-md bg-zinc-100/90 text-zinc-700 ring-1 ring-zinc-300 backdrop-blur hover:bg-zinc-200 disabled:opacity-40 dark:bg-zinc-800/70 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 flex items-center justify-center shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}

          {/* Grid area (reduced width by rails) */}
          <ul className="flex-1 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  <li key={`skeleton-${idx}`} className="h-24">
                    <div className="flex h-full items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 p-4 dark:bg-zinc-900 dark:ring-zinc-700/40">
                      <div className="h-10 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                  </li>
                ))
              : current.map((item, idx) => (
                  <li key={item.id ?? idx} className="h-24">
                    {item.website ? (
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.name}
                        className="group block h-full focus:outline-none"
                      >
                        <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 p-4 transition hover:ring-zinc-300 dark:bg-zinc-900 dark:ring-zinc-700/40 dark:hover:ring-zinc-600 transform-gpu duration-300 ease-out group-hover:scale-[1.02]">
                          {item.logo ? (
                            <img
                              src={item.logo}
                              alt={`${item.name} logo`}
                              loading="lazy"
                              className="mx-auto max-h-10 w-full object-contain filter grayscale saturate-0 opacity-80 transition duration-300 ease-out group-hover:grayscale-0 group-hover:saturate-100 group-hover:opacity-100"
                            />
                          ) : (
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                              {item.name || 'Visit website'}
                            </span>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 p-4 dark:bg-zinc-900 dark:ring-zinc-700/40 transform-gpu transition duration-300 ease-out hover:scale-[1.02]">
                        {item.logo ? (
                          <img
                            src={item.logo}
                            alt={`${item.name} logo`}
                            loading="lazy"
                            className="mx-auto max-h-10 w-full object-contain filter grayscale saturate-0 opacity-80 transition duration-300 ease-out hover:grayscale-0 hover:saturate-100 hover:opacity-100"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">
                            {item.name || 'Company'}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
          </ul>

          {/* Right rail */}
          {totalPages > 1 && (
            <div className="hidden sm:flex self-stretch">
              <button
                type="button"
                onClick={nextPage}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="w-10 md:w-12 self-stretch rounded-md bg-zinc-100/90 text-zinc-700 ring-1 ring-zinc-300 backdrop-blur hover:bg-zinc-200 disabled:opacity-40 dark:bg-zinc-800/70 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 flex items-center justify-center shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dots below grid */}
      {totalPages > 1 && (
        <div aria-label="Pagination" className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === page ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
