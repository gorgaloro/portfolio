'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import AdminShell from '@/components/admin/AdminShell'

type Company = { company_id: number; name: string; domain?: string | null }
type Deal = { deal_id: number; job_title?: string; job_url?: string; summary?: any }

export default function ReferralGeneratorPage() {
  const [step, setStep] = useState<number>(1)

  // Step 1 - company
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Company[]>([])
  const [company, setCompany] = useState<Company | null>(null)

  // Step 2 - jobs
  const [deals, setDeals] = useState<Deal[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const selectedDealIds = useMemo(() => Object.entries(selected).filter(([,v])=>v).map(([k])=>Number(k)), [selected])

  // Step 3 - enrich
  const [warmIntroMsg, setWarmIntroMsg] = useState<string>('')
  const [progress, setProgress] = useState<string>('')
  const [working, setWorking] = useState(false)

  // Step 4 - preview
  const [preview, setPreview] = useState<{ intro?: string; jobs?: Deal[] }>({})

  async function searchCompanies() {
    setSearching(true)
    try {
      const r = await fetch(`/api/admin/companies-search?q=${encodeURIComponent(query)}`)
      const j = await r.json()
      if (r.ok) setResults(j.companies || [])
    } catch {}
    setSearching(false)
  }

  async function loadJobs() {
    if (!company) return
    setDeals([])
    setSelected({})
    try {
      const r = await fetch(`/api/company-jobs?companyId=${company.company_id}`)
      const j = await r.json()
      if (r.ok) {
        const list: Deal[] = j.deals || []
        setDeals(list)
        const def: Record<number, boolean> = {}
        for (const d of list) def[d.deal_id] = true
        setSelected(def)
      }
    } catch {}
  }

  async function runWarmIntro() {
    if (!company) return
    setWorking(true)
    setProgress('Generating warm intro…')
    try {
      const resp = await fetch('/api/admin/warm-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.company_id, companyName: company.name })
      })
      const j = await resp.json()
      if (resp.ok) {
        setWarmIntroMsg(j.intro?.message || '')
        setProgress('Warm intro generated')
      } else {
        setProgress(j.error || 'Warm intro failed')
      }
    } catch (e: any) {
      setProgress(String(e?.message ?? e))
    }
    setWorking(false)
  }

  async function runEnrichments() {
    if (!company || selectedDealIds.length === 0) return
    setWorking(true)
    setProgress('Analyzing selected jobs…')
    try {
      // analyze fit
      await fetch('/api/analyze-job-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealIds: selectedDealIds, profile_url: 'https://www.allenwalker.info/about' })
      })
      setProgress('Summarizing job descriptions…')
      await fetch('/api/summarize-jd', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealIds: selectedDealIds })
      })
      setProgress('Enrichment complete')
    } catch (e:any) {
      setProgress(String(e?.message ?? e))
    }
    setWorking(false)
  }

  async function buildPreview() {
    if (!company) return
    try {
      const [introResp, jobsResp] = await Promise.all([
        fetch(`/api/company-intro?companyId=${company.company_id}`),
        fetch(`/api/company-jobs?companyId=${company.company_id}`)
      ])
      const introJ = await introResp.json().catch(()=>({}))
      const jobsJ = await jobsResp.json().catch(()=>({}))
      setPreview({ intro: introJ?.intro?.message || '', jobs: jobsJ?.deals || [] })
    } catch {}
  }

  useEffect(() => { if (step === 2) loadJobs() }, [step])
  useEffect(() => { if (step === 4) buildPreview() }, [step])

  return (
    <AdminShell title="Referral Generator" current="Referrals">
      <div className="space-y-8">
        <div className="flex items-center gap-2 text-sm">
          <span className={step>=1? 'font-semibold': ''}>Step 1</span>
          <span>›</span>
          <span className={step>=2? 'font-semibold': ''}>Step 2</span>
          <span>›</span>
          <span className={step>=3? 'font-semibold': ''}>Step 3</span>
          <span>›</span>
          <span className={step>=4? 'font-semibold': ''}>Step 4</span>
          <span>›</span>
          <span className={step>=5? 'font-semibold': ''}>Step 5</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 1: Select Company</h2>
            <div className="flex gap-2">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search company…" className="w-80 rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <button onClick={searchCompanies} className="rounded-md bg-zinc-900 text-white px-3 py-2 text-sm">{searching? 'Searching…':'Search'}</button>
            </div>
            <div className="space-y-2">
              {results.map(c => (
                <button key={c.company_id} onClick={()=>{ setCompany(c); setStep(2) }} className="block text-left w-full rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.domain || c.company_id}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && company && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 2: Select Jobs at {company.name}</h2>
            <div className="space-y-2">
              {deals.length === 0 && <div className="text-sm text-zinc-500">No jobs synced for this company.</div>}
              {deals.map(d => (
                <label key={d.deal_id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!selected[d.deal_id]} onChange={(e)=>setSelected(s=>({ ...s, [d.deal_id]: e.target.checked }))} />
                  <span>{d.job_title || 'Untitled Role'} <span className="text-zinc-400">(#{d.deal_id})</span></span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setStep(1)} className="rounded-md border px-3 py-2 text-sm">Back</button>
              <button onClick={()=>setStep(3)} disabled={selectedDealIds.length===0} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === 3 && company && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 3: Generate Warm Intro & Enrich Jobs</h2>
            <div className="flex gap-2">
              <button onClick={runWarmIntro} disabled={working} className="rounded-md bg-zinc-900 text-white px-3 py-2 text-sm">Warm Intro</button>
              <button onClick={runEnrichments} disabled={working || selectedDealIds.length===0} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm">Enrich Jobs</button>
              <button onClick={()=>{ runWarmIntro(); runEnrichments() }} disabled={working || selectedDealIds.length===0} className="rounded-md border px-3 py-2 text-sm">Run All</button>
            </div>
            {progress && <div className="text-sm text-zinc-500">{progress}</div>}
            {warmIntroMsg && (
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{warmIntroMsg}</div>
            )}
            <div className="flex gap-2">
              <button onClick={()=>setStep(2)} className="rounded-md border px-3 py-2 text-sm">Back</button>
              <button onClick={()=>setStep(4)} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm">Next</button>
            </div>
          </div>
        )}

        {step === 4 && company && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 4: Preview</h2>
            <button onClick={buildPreview} className="rounded-md border px-3 py-2 text-sm">Refresh Preview</button>
            <div className="rounded-md border p-4 space-y-4">
              <div className="text-sm whitespace-pre-wrap">{preview.intro || 'No intro saved yet.'}</div>
              <div className="space-y-3">
                {(preview.jobs||[]).map((d: any) => (
                  <div key={d.deal_id} className="text-sm">
                    <div className="font-medium">{d.job_title}</div>
                    <div className="text-zinc-600 whitespace-pre-wrap">{d.summary?.narrative || 'No narrative yet.'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setStep(3)} className="rounded-md border px-3 py-2 text-sm">Back</button>
              <button onClick={()=>setStep(5)} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm">Next</button>
            </div>
          </div>
        )}

        {step === 5 && company && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 5: Publish</h2>
            <p className="text-sm text-zinc-600">Publishing workflow coming next. We will save the selected jobs and generate a shareable referral page.</p>
            <div className="flex gap-2">
              <button onClick={()=>setStep(4)} className="rounded-md border px-3 py-2 text-sm">Back</button>
              <button disabled className="rounded-md bg-zinc-900 text-white px-3 py-2 text-sm opacity-50 cursor-not-allowed">Publish</button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
