'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'referral_ctx'
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 48

type Ctx = {
  slug: string
  company?: string
  url?: string
  exp: number
}

export function ReferralContextCapture({ slug, company, ttlMs = DEFAULT_TTL_MS }: { slug: string; company?: string; ttlMs?: number }) {
  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : undefined
    const exp = Date.now() + ttlMs
    const ctx: Ctx = { slug, company, url, exp }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx))
      document.cookie = `referral_ctx=1; Path=/; Max-Age=${Math.floor(ttlMs / 1000)}; SameSite=Lax`
    } catch {}
  }, [slug, company, ttlMs])
  return null
}

export function ReferralReturnBar() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed: Ctx = JSON.parse(raw)
      if (!parsed?.slug || (parsed.exp && parsed.exp < Date.now())) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      setCtx(parsed)
    } catch {}
  }, [])

  if (!ctx) return null

  return (
    <div className="hidden md:flex items-center gap-3 rounded-full bg-white/90 px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-900/5 shadow-lg dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
      <span className="truncate max-w-[180px]">
        Viewing referral for {ctx.company || ctx.slug}
      </span>
      <Link
        href={`/referrals/${encodeURIComponent(ctx.slug)}`}
        className="rounded-full bg-emerald-600 px-3 py-1 text-white text-xs hover:bg-emerald-700"
      >
        Back to referral
      </Link>
      <button
        onClick={() => {
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
          setCtx(null)
        }}
        className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        Dismiss
      </button>
    </div>
  )
}
