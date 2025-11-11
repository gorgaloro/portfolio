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
  const [referrerName, setReferrerName] = useState<string>('')
  const [warmIntro, setWarmIntro] = useState<string>('')
  const [warmLoading, setWarmLoading] = useState(false)
  const [warmMsg, setWarmMsg] = useState<string>('')

  const [searchQ, setSearchQ] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [companies, setCompanies] = useState<Array<{ company_id: number; name: string; domain?: string | null }>>([])
  const [companyDeals, setCompanyDeals] = useState<Array<{ deal_id: number; job_title?: string; dealname?: string; job_url?: string | null; pipeline?: string | null; dealstage?: string | null }>>([])
  const [checked, setChecked] = useState<Record<number, boolean>>({})

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
      const list = (j.companies || []) as Array<{ company_id: number; name: string; domain?: string | null }>
      setCompanies(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
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
      const r = await fetch(`/api/company-jobs?companyId=${id}`)
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
      setWarmIntro(intro?.message || '')
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
          referrerName: referrerName || undefined,
          regenerate,
        })
      })
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error || 'Generate failed')
      const intro = j.intro || null
      setWarmIntro(intro?.message || '')
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

  return (
    <AdminShell title="Referrals" current="Referrals">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin: Company Search & Jobs</h1>
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
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.domain || c.company_id}</div>
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
                      <th className="py-2 pr-4">Pipeline</th>
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
                        <td className="py-2 pr-4 align-top text-zinc-600">{d.pipeline || '—'}</td>
                        <td className="py-2 pr-4 align-top text-zinc-600">{d.dealstage || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Admin: Warm Intro</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm text-zinc-600">Company ID</label>
            <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="193056111306" className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-zinc-600">Company Name (optional)</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-zinc-600">Referrer Name (optional)</label>
            <input value={referrerName} onChange={(e) => setReferrerName(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            <button onClick={warmLoad} disabled={!companyId || warmLoading} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Load</button>
            <button onClick={() => warmGenerate(false)} disabled={!companyId || warmLoading} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm">{warmLoading ? 'Working…' : 'Generate'}</button>
            <button onClick={warmSave} disabled={!companyId || warmLoading} className="rounded-md bg-zinc-900 text-white px-3 py-2 text-sm">Save</button>
          </div>
        </div>
        {warmMsg && <div className="text-sm text-zinc-500">{warmMsg}</div>}
        <textarea value={warmIntro} onChange={(e) => setWarmIntro(e.target.value)} rows={6} placeholder="Generated two-paragraph intro will appear here" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />

        <h1 className="text-2xl font-semibold">Admin: Referral Attributes</h1>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm text-zinc-600">Deal ID</label>
            <input value={dealId} onChange={(e) => setDealId(e.target.value)} placeholder="196977522406" className="mt-1 w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <button onClick={load} disabled={!dealId || loading} className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-50">{loading ? 'Loading…' : 'Load'}</button>
          {msg && <div className="text-sm text-zinc-500">{msg}</div>}
        </div>

        {rows && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-2 pr-4">Attribute</th>
                  <th className="py-2 pr-4">Pillar</th>
                  <th className="py-2 pr-4">Color</th>
                  <th className="py-2 pr-4">Visible</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.attribute_name} className="border-t border-zinc-100">
                    <td className="py-2 pr-4">
                      <input
                        className="w-80 rounded-md border border-zinc-300 px-2 py-1"
                        value={r.label}
                        onChange={(e) => update(i, { label: e.target.value })}
                      />
                      <div className="text-xs text-zinc-400">Base: {r.attribute_name}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={r.pillar}
                        onChange={(e) => update(i, { pillar: e.target.value as AttrRow['pillar'] })}
                        className="rounded-md border border-zinc-300 px-2 py-1"
                      >
                        <option value="industry">Industry</option>
                        <option value="process">Process</option>
                        <option value="technical">Technical</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={r.color}
                        onChange={(e) => update(i, { color: e.target.value as AttrRow['color'] })}
                        className="rounded-md border border-zinc-300 px-2 py-1"
                      >
                        <option value="green">Green</option>
                        <option value="yellow">Yellow</option>
                        <option value="grey">Grey</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <input type="checkbox" checked={r.visible} onChange={(e) => update(i, { visible: e.target.checked })} />
                    </td>
                    <td className="py-2 pr-4 space-x-2">
                      <button onClick={() => save(i)} className="rounded-md bg-zinc-900 text-white px-3 py-1 text-xs">Save</button>
                      <button onClick={() => reset(i)} className="rounded-md border border-zinc-300 px-3 py-1 text-xs">Reset</button>
                      <button onClick={() => suggest(i)} className="rounded-md border border-emerald-600 text-emerald-700 px-3 py-1 text-xs">Suggest</button>
                      {r.has_override && <span className="text-xs text-emerald-600">overridden</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
