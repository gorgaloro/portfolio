export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { requireAdminSupabaseClient } from '@/lib/admin/supabase'
import {
  associateHubSpotObjects,
  createHubSpotObject,
} from '@/lib/hubspot-api'
import {
  extractJobDataFromHtml,
  fetchJobPage,
  hashUrl,
  isAllowedPublicUrl,
  normalizeImportUrl,
  parseSalary,
  splitDescriptionSections,
  type ExtractedJobData,
  type DuplicateDealMatch,
} from '@/lib/jd-import'
import { resolveCompany } from '@/lib/company-resolver'

type ImportMode = 'extract' | 'confirm'

type ImportJdRequest = {
  mode?: ImportMode
  url?: string
  company_id?: string
  fields?: Partial<ExtractedJobData>
}

type DealRow = {
  deal_id: number
  job_title: string | null
  dealname: string | null
  job_url: string | null
}

type JdImportCacheRow = {
  url_hash: string
  source_url: string
  extracted_data: ExtractedJobData
  deal_id?: string | null
  status: 'extracted' | 'confirmed' | 'failed'
  expires_at: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function safeDate(value: string): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

function withDefaults(base: Partial<ExtractedJobData>, sourceUrl: string): ExtractedJobData {
  const salary = parseSalary(base.salary_raw || '')
  const sections = splitDescriptionSections(base.description || '')

  return {
    job_title: String(base.job_title || '').trim(),
    company_name: String(base.company_name || '').trim(),
    company_domain: String(base.company_domain || '').trim(),
    location: String(base.location || '').trim(),
    employment_type: base.employment_type || '',
    salary_raw: salary.salary_raw,
    salary_min: salary.salary_min,
    salary_max: salary.salary_max,
    description: String(base.description || '').trim(),
    jd_section_company: base.jd_section_company || sections.jd_section_company,
    jd_section_role: base.jd_section_role || sections.jd_section_role,
    jd_section_qualifications: base.jd_section_qualifications || sections.jd_section_qualifications,
    posted_date: safeDate(base.posted_date || ''),
    source_url: sourceUrl,
    extraction_method: base.extraction_method || 'ai_fallback',
    confidence: base.confidence || {
      job_title: base.job_title ? 'medium' : 'low',
      company_name: base.company_name ? 'medium' : 'low',
      location: base.location ? 'medium' : 'low',
      salary: salary.salary_raw ? 'medium' : 'low',
      description: base.description ? 'medium' : 'low',
      section_segmentation: sections.confidence,
    },
  }
}

async function callOpenAIFallback(params: {
  sourceUrl: string
  text: string
}): Promise<Partial<ExtractedJobData>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return {}

  const system = [
    'You extract structured job posting data from webpage text.',
    'Return strict JSON only with keys:',
    'job_title, company_name, location, employment_type, salary_raw, description, posted_date.',
    'employment_type must be FTE or Contract or empty string.',
  ].join(' ')

  const user = `Source URL: ${params.sourceUrl}\n\nPage text:\n${params.text.slice(0, 10_000)}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!response.ok) return {}

  const json = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = String(json.choices?.[0]?.message?.content || '').trim()
  if (!content) return {}

  const normalized = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')

  try {
    const parsed = JSON.parse(normalized) as Partial<ExtractedJobData>
    return parsed
  } catch {
    return {}
  }
}

async function getDuplicateDeals(supabase: SupabaseClient, sourceUrl: string): Promise<DuplicateDealMatch[]> {
  const response = await supabase
    .from('hubspot_deals')
    .select('deal_id, job_title, dealname, job_url')
    .eq('job_url', sourceUrl)
    .limit(10)

  if (response.error) return []

  return ((response.data || []) as DealRow[]).map((row) => ({
    deal_id: row.deal_id,
    job_title: row.job_title,
    company: row.dealname,
    deal_url: row.job_url || sourceUrl,
  }))
}

async function persistCache(supabase: SupabaseClient, row: JdImportCacheRow) {
  await supabase.from('jd_import_cache').upsert(row, { onConflict: 'url_hash' })
}

async function handleExtract(supabase: SupabaseClient, url: string) {
  const fetched = await fetchJobPage(url)
  const extracted = extractJobDataFromHtml(fetched.html, fetched.finalUrl)

  let merged = extracted
  if (!merged.job_title || !merged.description || merged.extraction_method === 'ai_fallback') {
    const ai = await callOpenAIFallback({ sourceUrl: fetched.finalUrl, text: fetched.html })
    merged = withDefaults(
      {
        ...merged,
        ...ai,
        extraction_method: merged.extraction_method === 'ai_fallback' ? 'ai_fallback' : merged.extraction_method,
      },
      fetched.finalUrl,
    )
  }

  const companyMatch = await resolveCompany({
    sourceUrl: fetched.finalUrl,
    companyName: merged.company_name,
    createIfMissing: false,
  })

  const duplicates = await getDuplicateDeals(supabase, fetched.finalUrl)

  const cachePayload: JdImportCacheRow = {
    url_hash: hashUrl(fetched.finalUrl),
    source_url: fetched.finalUrl,
    extracted_data: merged,
    status: 'extracted',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }

  try {
    await persistCache(supabase, cachePayload)
  } catch {
    // cache is best-effort
  }

  return NextResponse.json({
    success: true,
    extraction: merged,
    company_match: companyMatch,
    duplicate_check: {
      has_duplicates: duplicates.length > 0,
      matches: duplicates,
    },
  })
}

function dealNameFor(fields: ExtractedJobData): string {
  if (fields.job_title && fields.company_name) return `${fields.job_title} - ${fields.company_name}`
  if (fields.job_title) return fields.job_title
  if (fields.company_name) return `Role at ${fields.company_name}`
  return 'Imported role'
}

function mapDealProperties(fields: ExtractedJobData) {
  return {
    dealname: dealNameFor(fields),
    job_title: fields.job_title || null,
    job_url: fields.source_url,
    job_description: fields.description || null,
    job_location: fields.location || null,
    employment_type: fields.employment_type || null,
    salary_min: fields.salary_min,
    salary_raw: fields.salary_raw || null,
    jd_section_company: fields.jd_section_company || null,
    jd_section_role: fields.jd_section_role || null,
    jd_section_qualifications: fields.jd_section_qualifications || null,
    job_posted_date: safeDate(fields.posted_date) || null,
    import_method: 'URL Import',
    imported_at: new Date().toISOString().slice(0, 10),
    amount: fields.salary_max,
  }
}

function getHubSpotDealUrl(dealId: string): string {
  const portalId = String(process.env.HUBSPOT_PORTAL_ID || '').trim()
  if (!portalId) return dealId
  return `https://app.hubspot.com/contacts/${portalId}/record/0-3/${dealId}`
}

async function handleConfirm(supabase: SupabaseClient, body: ImportJdRequest, sourceUrl: string) {
  const fieldInput = body.fields || {}
  const fields = withDefaults(
    {
      ...fieldInput,
      source_url: sourceUrl,
    },
    sourceUrl,
  )

  const company = await resolveCompany({
    providedCompanyId: body.company_id,
    sourceUrl,
    companyName: fields.company_name,
    createIfMissing: true,
  })

  const deal = await createHubSpotObject('deals', mapDealProperties(fields))

  if (company.matched_company?.company_id) {
    await associateHubSpotObjects({
      fromObjectType: 'deals',
      fromObjectId: deal.id,
      toObjectType: 'companies',
      toObjectId: company.matched_company.company_id,
    })
  }

  const cachePayload: JdImportCacheRow = {
    url_hash: hashUrl(sourceUrl),
    source_url: sourceUrl,
    extracted_data: fields,
    deal_id: deal.id,
    status: 'confirmed',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }

  try {
    await persistCache(supabase, cachePayload)
  } catch {
    // cache is best-effort
  }

  return NextResponse.json(
    {
      success: true,
      deal: {
        deal_id: deal.id,
        company_id: company.matched_company?.company_id || null,
        company_matched: company.status === 'matched' || company.status === 'ambiguous',
        company_created: company.status === 'created',
        company_enriched: Boolean(company.matched_company?.domain),
        hubspot_url: getHubSpotDealUrl(deal.id),
      },
    },
    { status: 201 },
  )
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ImportJdRequest
    const mode = body.mode || 'extract'

    if (mode !== 'extract' && mode !== 'confirm') {
      return withCors(NextResponse.json({ error: 'invalid_mode', message: 'mode must be extract or confirm' }, { status: 400 }))
    }

    const sourceUrl = normalizeImportUrl(String(body.url || '').trim())
    if (!sourceUrl || !isAllowedPublicUrl(sourceUrl)) {
      return withCors(NextResponse.json({ error: 'invalid_url', message: 'URL must be a valid public HTTP/HTTPS URL' }, { status: 400 }))
    }

    const supabase = requireAdminSupabaseClient()

    if (mode === 'extract') {
      return withCors(await handleExtract(supabase, sourceUrl))
    }

    return withCors(await handleConfirm(supabase, body, sourceUrl))
  } catch (error: unknown) {
    return withCors(NextResponse.json({ error: 'import_failed', message: getErrorMessage(error) }, { status: 500 }))
  }
}
