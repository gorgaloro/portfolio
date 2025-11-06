'use client'

import { useState } from 'react'
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

  return (
    <AdminShell title="Referrals" current="Referrals">
      <div className="space-y-6">
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
