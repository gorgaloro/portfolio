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
    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
      <span className="break-words max-w-full">A personalized look at my fit for opportunities at {ctx.company || ctx.slug}</span>
      <span className="text-zinc-400">·</span>
      <Link
        href={`/referrals/${encodeURIComponent(ctx.slug)}`}
        className="font-semibold hover:underline"
      >
        Back to referral
      </Link>
      <button
        aria-label="Dismiss referral context"
        onClick={() => {
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
          setCtx(null)
        }}
        className="ml-1 text-red-600 hover:text-red-700 font-semibold"
      >
        ×
      </button>
    </div>
  )
}
