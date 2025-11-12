'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import AdminShell from '@/components/admin/AdminShell'

type AttrRow = {
  deal_id: number
  attribute_name: string
  label: string
  pillar: 'industry' | 'process' | 'technical'
  category: 'industry' | 'process' | 'technical'
  color: 'green' | 'yellow' | 'grey'
  fit_color: 'green' | 'yellow' | 'grey'
  visible: boolean
  final_rank: number
  has_override: boolean
}

export default function AdminReferralsPage() {
  const [dealId, setDealId] = useState<string>('')
  const [rows, setRows] = useState<AttrRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const [companyId, setCompanyId] = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('')
  const [warmIntro, setWarmIntro] = useState<string>('')
  const [warmLoading, setWarmLoading] = useState(false)
  const [warmMsg, setWarmMsg] = useState<string>('')

  const [searchQ, setSearchQ] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [companies, setCompanies] = useState<Array<{ company_id: number; name: string; domain?: string | null; jobs_count?: number }>>([])
  const [companyDeals, setCompanyDeals] = useState<Array<{ deal_id: number; job_title?: string; dealname?: string; job_url?: string | null; pipeline?: string | null; dealstage?: string | null }>>([])
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const [enriching, setEnriching] = useState(false)
  const [enrichMsg, setEnrichMsg] = useState<string>('')
  const [enrichOpts, setEnrichOpts] = useState<{ summary: boolean; fit: boolean; keywords: boolean; score: boolean }>({ summary: true, fit: true, keywords: true, score: true })
  const [enrichResults, setEnrichResults] = useState<Array<{ deal_id: number; job_title?: string | null; jd_summary?: string | null; fit_summary?: string | null; keywords?: { industry?: string[]; process?: string[]; technical?: string[] }; fit_score?: number | null }>>([])

  // Typeahead search
  useEffect(() => {
    const t = setTimeout(() => {
      searchCompanies().catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [searchQ])

  async function load() {
    setMsg('')
    setLoading(true)
    setRows(null)
    try {
      const r = await fetch(`/api/admin/referral-attributes?dealId=${encodeURIComponent(dealId)}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load')
      const attrs: AttrRow[] = j.attributes
      setRows(attrs)
    } catch (e: any) {
      setMsg(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  // Company search and deal selection
  async function searchCompanies() {
    setSearching(true)
    setCompanies([])
    try {
      const r = await fetch(`/api/admin/companies-search?q=${encodeURIComponent(searchQ)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Search failed')
      const list = (j.companies || []) as Array<{ company_id: number; name: string; domain?: string | null; jobs_count?: number }>
      setCompanies(list.sort((a, b) => ((b.jobs_count || 0) - (a.jobs_count || 0)) || (a.name || '').localeCompare(b.name || '')))
    } catch (e: any) {
      setMsg(e.message || String(e))
    } finally {
      setSearching(false)
    }
  }

  async function selectCompany(c: { company_id: number; name: string }) {
    setCompanyId(String(c.company_id))
    setCompanyName(c.name || '')
    setWarmIntro('')
    await loadCompanyDeals(c.company_id)
  }

  async function loadCompanyDeals(id: number) {
    setCompanyDeals([])
    setChecked({})
    try {
      const r = await fetch(`/api/company-jobs?companyId=${id}&pipelineId=1320210144`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Load deals failed')
      const list = (j.deals || []) as Array<{ deal_id: number; job_title?: string; dealname?: string; job_url?: string | null; pipeline?: string | null; dealstage?: string | null }>
      setCompanyDeals(list)
      const def: Record<number, boolean> = {}
      for (const d of list) def[d.deal_id] = true
      setChecked(def)
    } catch (e: any) {
      setMsg(e.message || String(e))
    }
  }

  async function suggest(idx: number) {
    if (!rows) return
    const r = rows[idx]
    setMsg('')
    try {
      const resp = await fetch('/api/admin/suggest-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attribute: (r.label || r.attribute_name), pillar: r.pillar, max_words: 5 })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Suggest failed')
      if (j.label && typeof j.label === 'string') {
        update(idx, { label: j.label })
        setMsg('Suggestion applied')
      } else {
        setMsg('No suggestion returned')
      }
    } catch (e: any) {
      setMsg(e.message || String(e))
    }
  }

  function update(idx: number, patch: Partial<AttrRow>) {
    if (!rows) return
    const copy = rows.slice()
    copy[idx] = { ...copy[idx], ...patch }
    setRows(copy)
  }

  async function save(idx: number) {
    if (!rows) return
    const r = rows[idx]
    setMsg('')
    try {
      const resp = await fetch('/api/admin/referral-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: r.deal_id,
          attribute_name: r.attribute_name,
          updates: {
            label: r.label,
            pillar: r.pillar,
            color: r.color,
            visible: r.visible,
          }
        })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Save failed')
      setMsg('Saved')
      update(idx, { has_override: true })
    } catch (e: any) {
      setMsg(e.message || String(e))
    }
  }

  async function reset(idx: number) {
    if (!rows) return
    const r = rows[idx]
    setMsg('')
    try {
      const resp = await fetch('/api/admin/referral-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: r.deal_id, attribute_name: r.attribute_name, reset: true })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Reset failed')
      // restore original values from base fields
      update(idx, { label: r.attribute_name, pillar: r.category, color: r.fit_color, has_override: false })
      setMsg('Reset')
    } catch (e: any) {
      setMsg(e.message || String(e))
    }
  }

  // Warm Intro helpers (Step 2)
  async function warmLoad() {
    setWarmMsg('')
    setWarmLoading(true)
    try {
      const r = await fetch(`/api/admin/warm-intro?companyId=${encodeURIComponent(companyId)}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load')
      const intro = j.intro || null
      setWarmIntro(sanitizeIntro(intro?.message || ''))
      if (intro?.company_name) setCompanyName(intro.company_name)
      setWarmMsg(intro ? 'Loaded' : 'No existing intro')
    } catch (e: any) {
      setWarmMsg(e.message || String(e))
    } finally {
      setWarmLoading(false)
    }
  }

  async function warmGenerate(regenerate = false) {
    if (!companyId) return
    setWarmMsg('')
    setWarmLoading(true)
    try {
      const resp = await fetch('/api/admin/warm-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: Number(companyId),
          companyName: companyName || undefined,
          regenerate,
        })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Generate failed')
      const intro = j.intro || null
      setWarmIntro(sanitizeIntro(intro?.message || ''))
      if (intro?.company_name) setCompanyName(intro.company_name)
      setWarmMsg('Generated')
    } catch (e: any) {
      setWarmMsg(e.message || String(e))
    } finally {
      setWarmLoading(false)
    }
  }

  async function warmSave() {
    if (!companyId) return
    setWarmMsg('')
    setWarmLoading(true)
    try {
      const resp = await fetch('/api/admin/warm-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: Number(companyId),
          companyName: companyName || undefined,
          message: warmIntro,
          saveOnly: true,
        })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Save failed')
      setWarmMsg('Saved')
    } catch (e: any) {
      setWarmMsg(e.message || String(e))
    } finally {
      setWarmLoading(false)
    }
  }

  async function enrichSelected() {
    const ids = Object.entries(checked).filter(([, v]) => v).map(([k]) => Number(k))
    setEnrichMsg('')
    setEnrichResults([])
    if (ids.length === 0) { setEnrichMsg('Select at least one job'); return }
    setEnriching(true)
    try {
      const resp = await fetch('/api/admin/enrich-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealIds: ids, options: enrichOpts, preview: true }) })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Enrichment failed')
      setEnrichResults(j.results || [])
      setEnrichMsg(`Enriched ${Array.isArray(j.results) ? j.results.length : 0} job(s)`) 
    } catch (e: any) {
      setEnrichMsg(e.message || String(e))
    } finally {
      setEnriching(false)
    }
  }

  function sanitizeIntro(t: string) {
    let s = String(t || '')
    s = s.replace(/^(\s*(hi|hello|hey)[^\n]*\n+)/i, '')
    s = s.replace(/^.*https?:[^\n]*$/gmi, '').replace(/\n{3,}/g, '\n\n')
    s = s.replace(/\n+\s*(best|cheers|sincerely|thanks|thank you)[^\n]*$/i, '')
    return s.trim()
  }

  return (
    <AdminShell title="Referrals" current="Referrals">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Company & Job Selection</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-sm text-zinc-600">Company Name</label>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search or browse all…"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-6 flex gap-2">
            <button onClick={searchCompanies} className="rounded-md bg-zinc-900 text-white px-3 py-2 text-sm">{searching ? 'Searching…' : 'Search'}</button>
            <button onClick={() => { setSearchQ(''); searchCompanies() }} className="rounded-md border px-3 py-2 text-sm">Browse All</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-zinc-200">
            <div className="px-3 py-2 text-sm font-medium bg-zinc-50">Companies</div>
            <div className="max-h-72 overflow-y-auto divide-y">
              {companies.map((c) => (
                <button
                  key={c.company_id}
                  onClick={() => selectCompany(c)}
                  className="w-full px-3 py-2 text-sm hover:bg-zinc-50 flex items-center justify-between"
                >
                  <div className="text-left">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.domain || c.company_id}</div>
                  </div>
                  {(typeof c.jobs_count === 'number') && c.jobs_count > 0 && (
                    <span className="ml-3 inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-emerald-600 text-white text-xs font-semibold px-2">
                      {c.jobs_count}
                    </span>
                  )}
                </button>
              ))}
              {companies.length === 0 && (
                <div className="px-3 py-3 text-sm text-zinc-500">{searching ? 'Searching…' : 'No results'}</div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-zinc-200">
            <div className="px-3 py-2 text-sm font-medium bg-zinc-50 flex items-center justify-between">
              <div>Deals {companyName ? `for ${companyName}` : ''}</div>
              {companyDeals.length > 0 && (
                <div className="space-x-2">
                  <button onClick={() => setChecked(Object.fromEntries(companyDeals.map(d => [d.deal_id, true])))} className="rounded-md border px-2 py-1 text-xs">Select all</button>
                  <button onClick={() => setChecked({})} className="rounded-md border px-2 py-1 text-xs">Unselect all</button>
                </div>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {companyDeals.length === 0 && (
                <div className="px-3 py-3 text-sm text-zinc-500">{companyId ? 'No deals for this company.' : 'Select a company to view deals.'}</div>
              )}
              {companyDeals.length > 0 && (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-zinc-500">
                      <th className="py-2 pl-3 pr-2">Sel</th>
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyDeals.map((d) => (
                      <tr key={d.deal_id} className="border-t">
                        <td className="py-2 pl-3 pr-2 align-top">
                          <input type="checkbox" checked={!!checked[d.deal_id]} onChange={(e)=> setChecked(s => ({ ...s, [d.deal_id]: e.target.checked }))} />
                        </td>
                        <td className="py-2 pr-4">
                          <a href={d.job_url || '#'} target="_blank" className="text-emerald-600 hover:underline">{d.job_title || d.dealname || `#${d.deal_id}`}</a>
                          <div className="text-[11px] text-zinc-400">#{d.deal_id}</div>
                        </td>
                        <td className="py-2 pr-4 align-top text-zinc-600">{(d as any).stage_label || d.dealstage || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      <h1 className="text-2xl font-semibold">Introduction</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <label className="block text-sm text-zinc-600">Company Name (optional)</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div className="md:col-span-4 flex items-end gap-2">
          <button onClick={warmLoad} disabled={!companyId || warmLoading} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Load</button>
          <button onClick={() => warmGenerate(false)} disabled={!companyId || warmLoading} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm">{warmLoading ? 'Working…' : 'Generate'}</button>
        </div>
      </div>
      {warmMsg && <div className="text-sm text-zinc-500">{warmMsg}</div>}
      <textarea value={warmIntro} onChange={(e) => setWarmIntro(e.target.value)} rows={6} placeholder="Generated two-paragraph intro will appear here" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />

      <h1 className="text-2xl font-semibold">Job Enrichment</h1>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-8 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enrichOpts.summary} onChange={(e)=> setEnrichOpts(s => ({ ...s, summary: e.target.checked }))} />JD Summary</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enrichOpts.fit} onChange={(e)=> setEnrichOpts(s => ({ ...s, fit: e.target.checked }))} />Fit Summary</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enrichOpts.keywords} onChange={(e)=> setEnrichOpts(s => ({ ...s, keywords: e.target.checked }))} />Keywords</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enrichOpts.score} onChange={(e)=> setEnrichOpts(s => ({ ...s, score: e.target.checked }))} />Fit Score</label>
        </div>
        <div className="md:col-span-4 flex items-end justify-end">
          <button onClick={enrichSelected} disabled={enriching || Object.values(checked).every(v => !v)} className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-50">{enriching ? 'Enriching…' : 'Enrich Selected Jobs'}</button>
        </div>
      </div>
      {enrichMsg && <div className="text-sm text-zinc-500">{enrichMsg}</div>}
      {enrichResults.length > 0 && (
        <div className="space-y-4">
          {enrichResults.map((r) => (
            <div key={r.deal_id} className="rounded-md border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-emerald-700 font-medium">{r.job_title || `#${r.deal_id}`}</div>
                  <div className="text-xs text-zinc-400">#{r.deal_id}</div>
                </div>
                {typeof r.fit_score === 'number' && <div className="text-sm text-zinc-600">{Math.round(r.fit_score * 100)}%</div>}
              </div>
              {r.jd_summary && (<div className="mt-3 text-sm"><div className="font-medium">Job Description Summary</div><p className="mt-1 text-zinc-700">{r.jd_summary}</p></div>)}
              {r.fit_summary && (<div className="mt-3 text-sm"><div className="font-medium">Fit Summary</div><p className="mt-1 text-zinc-700">{r.fit_summary}</p></div>)}
              {r.keywords && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-zinc-500">Industry</div>
                    <div className="mt-1 flex flex-wrap gap-1">{(r.keywords.industry || []).map((k) => (<span key={k} className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">{k}</span>))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Process</div>
                    <div className="mt-1 flex flex-wrap gap-1">{(r.keywords.process || []).map((k) => (<span key={k} className="inline-flex items-center rounded-full bg-yellow-50 text-yellow-700 px-2 py-0.5 text-xs">{k}</span>))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Technical</div>
                    <div className="mt-1 flex flex-wrap gap-1">{(r.keywords.technical || []).map((k) => (<span key={k} className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 px-2 py-0.5 text-xs">{k}</span>))}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </AdminShell>
  )
}
