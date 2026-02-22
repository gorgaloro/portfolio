export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { classifyContact, type ContactTags } from '@/lib/auto-classifier'
import { requireAdminSupabaseClient } from '@/lib/admin/supabase'
import { createHubSpotNote, createHubSpotTask } from '@/lib/hubspot-engagement-writer'
import {
  associateContactToCompanyAndDeal,
  findHubSpotContactByLinkedIn,
  upsertHubSpotContact,
  type ContactProfilePayload,
} from '@/lib/hubspot-contact-writer'
import { isLinkedInProfileUrl, normalizeLinkedInUrl } from '@/lib/linkedin-url-utils'
import { resolveCompany } from '@/lib/company-resolver'

type CaptureMode = 'extract' | 'confirm'

type EducationInput = {
  university?: string | null
  institution?: string | null
  degree?: string | null
  field?: string | null
  field_of_study?: string | null
}

type ExperienceInput = {
  title?: string
  company?: string
  duration?: string
  responsibilities?: string
  is_current?: boolean
  employment_type?: string
  location?: string
}

type CertificationInput = {
  name?: string
  issuing_organization?: string
}

type ProfileInput = {
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  job_title?: string
  headline?: string
  company_name?: string
  location?: string
  linkedin_url?: string
  about?: string
  connection_degree?: string
  captured_date?: string
  education?: EducationInput | EducationInput[]
  experiences?: ExperienceInput[]
  certifications?: CertificationInput[]
  rawPageText?: string
}

type TaskInput = {
  enabled?: boolean
  template?: string
  description?: string
  due_days?: number
  due_date?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
}

type CaptureRequest = {
  mode?: CaptureMode
  profile?: ProfileInput
  tags?: Partial<ContactTags>
  company_id?: string
  link_deal_id?: string
  capture_notes?: string
  capture_next_steps?: string
  task?: TaskInput
}

type UpdateRequest = {
  contact_id?: string
  updates?: Partial<ProfileInput>
  add_tags?: Partial<ContactTags>
  link_deal_id?: string
  capture_notes?: string
  capture_next_steps?: string
  task?: TaskInput
}

type ContactListRow = {
  contact_id: string
  firstname: string | null
  lastname: string | null
  job_title: string | null
  company_name: string | null
  linkedin_url: string | null
  location: string | null
  network_roles: string[] | null
  life_projects: string[] | null
  metro_areas: string[] | null
  focus_areas: string[] | null
  task_status: string | null
  task_due_date: string | null
  imported_at: string | null
  capture_notes: string | null
  capture_next_steps: string | null
}

type ExistingContactRow = {
  contact_id: string
  firstname: string | null
  lastname: string | null
  job_title: string | null
  company_name: string | null
  linkedin_url: string | null
  network_roles: string[] | null
  life_projects: string[] | null
  metro_areas: string[] | null
  focus_areas: string[] | null
  imported_at: string | null
}

type DealOptionRow = {
  deal_id: number
  dealname: string | null
  job_title: string | null
  dealstage: string | null
}

type DealCompanyLinkRow = {
  deal_id: number
}

const DEFAULT_TAGS: ContactTags = {
  network_roles: [],
  life_projects: [],
  metro_areas: [],
  focus_areas: [],
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry || '').trim()).filter(Boolean)
}

function mergeTags(base: ContactTags, incoming: Partial<ContactTags>): ContactTags {
  const dedupe = (values: string[]) => Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))

  return {
    network_roles: dedupe([...(base.network_roles || []), ...asArray(incoming.network_roles)]),
    life_projects: dedupe([...(base.life_projects || []), ...asArray(incoming.life_projects)]),
    metro_areas: dedupe([...(base.metro_areas || []), ...asArray(incoming.metro_areas)]),
    focus_areas: dedupe([...(base.focus_areas || []), ...asArray(incoming.focus_areas)]),
  }
}

function normalizeEducation(value: ProfileInput['education']): EducationInput {
  const first = Array.isArray(value) ? value[0] : value
  return {
    university: String(first?.university || '').trim() || null,
    degree: String(first?.degree || '').trim() || null,
    field: String(first?.field || '').trim() || null,
  }
}

function normalizeProfile(value: ProfileInput | undefined): ContactProfilePayload {
  const profile = value || {}

  return {
    firstname: String(profile.firstname || '').trim(),
    lastname: String(profile.lastname || '').trim(),
    email: String(profile.email || '').trim() || null,
    phone: String(profile.phone || '').trim() || null,
    job_title: String(profile.job_title || profile.headline || '').trim() || null,
    company_name: String(profile.company_name || '').trim() || null,
    location: String(profile.location || '').trim() || null,
    linkedin_url: normalizeLinkedInUrl(String(profile.linkedin_url || '')),
    headline: String(profile.headline || '').trim() || null,
    about: String(profile.about || '').trim() || null,
    connection_degree: String(profile.connection_degree || '').trim() || null,
    education: normalizeEducation(profile.education),
  }
}

function getHubSpotContactUrl(contactId: string): string {
  const portalId = String(process.env.HUBSPOT_PORTAL_ID || '').trim()
  if (!portalId) return contactId
  return `https://app.hubspot.com/contacts/${portalId}/record/0-1/${contactId}`
}

function computeDueDate(task: TaskInput | undefined): string {
  if (task?.due_date) return task.due_date
  const dueDays = Number.isFinite(task?.due_days) ? Number(task?.due_days) : 3
  const dueDate = new Date(Date.now() + Math.max(0, dueDays) * 24 * 60 * 60 * 1000)
  return dueDate.toISOString().slice(0, 10)
}

async function fetchActiveDealsForCompany(supabase: SupabaseClient, companyId: string) {
  const companyNumber = Number(companyId)
  if (!Number.isFinite(companyNumber)) return []

  const links = await supabase
    .from('hubspot_deal_companies')
    .select('deal_id')
    .eq('company_id', companyNumber)

  if (links.error) return []

  const dealIds = ((links.data || []) as DealCompanyLinkRow[]).map((row) => row.deal_id)
  if (!dealIds.length) return []

  const deals = await supabase
    .from('hubspot_deals')
    .select('deal_id, dealname, job_title, dealstage')
    .in('deal_id', dealIds)
    .eq('pipeline', '1320210144')
    .order('hs_lastmodifieddate', { ascending: false })
    .limit(50)

  if (deals.error) return []

  return ((deals.data || []) as DealOptionRow[]).map((deal) => ({
    deal_id: String(deal.deal_id),
    dealname: deal.job_title || deal.dealname || `Deal ${deal.deal_id}`,
    dealstage: deal.dealstage || null,
  }))
}

async function logCapture(supabase: SupabaseClient, payload: {
  linkedin_url: string
  status: 'success' | 'duplicate' | 'updated' | 'failed'
  contact_id?: string | null
  auto_tags?: unknown
  user_tags?: unknown
  extraction_data?: unknown
  error_message?: string | null
}) {
  await supabase.from('linkedin_capture_log').insert({
    linkedin_url: payload.linkedin_url,
    status: payload.status,
    contact_id: payload.contact_id || null,
    auto_tags: payload.auto_tags || null,
    user_tags: payload.user_tags || null,
    extraction_data: payload.extraction_data || null,
    error_message: payload.error_message || null,
  })
}

async function saveContactSnapshot(supabase: SupabaseClient, params: {
  contactId: string
  profile: ContactProfilePayload
  tags: ContactTags
  companyId?: string | null
  linkDealId?: string | null
  taskId?: string | null
  taskDueDate?: string | null
  taskStatus?: string | null
  captureNotes?: string | null
  captureNextSteps?: string | null
  autoTagsApplied?: unknown
  profileData?: unknown
  capturedDate?: string | null
  pastExperienceSummary?: string | null
  importMethod: 'extension' | 'admin_console' | 'api'
}) {
  const { error } = await supabase.from('hubspot_contacts').upsert({
    contact_id: params.contactId,
    firstname: params.profile.firstname || null,
    lastname: params.profile.lastname || null,
    email: params.profile.email || null,
    phone: params.profile.phone || null,
    job_title: params.profile.job_title || null,
    company_name: params.profile.company_name || null,
    company_id: params.companyId || null,
    location: params.profile.location || null,
    linkedin_url: params.profile.linkedin_url,
    linkedin_headline: params.profile.headline || null,
    linkedin_about: params.profile.about || null,
    connection_degree: params.profile.connection_degree || null,
    education_university: params.profile.education?.university || null,
    education_degree: params.profile.education?.degree || null,
    education_field: params.profile.education?.field || null,
    network_roles: params.tags.network_roles,
    life_projects: params.tags.life_projects,
    metro_areas: params.tags.metro_areas,
    focus_areas: params.tags.focus_areas,
    auto_tags_applied: params.autoTagsApplied || {},
    capture_notes: params.captureNotes || null,
    capture_next_steps: params.captureNextSteps || null,
    task_id: params.taskId || null,
    task_due_date: params.taskDueDate || null,
    task_status: params.taskStatus || null,
    linked_deal_ids: params.linkDealId ? [params.linkDealId] : [],
    profile_data: params.profileData || {},
    import_method: params.importMethod,
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'contact_id' })

  if (error) {
    console.error('[capture-contact] Supabase upsert error:', error.message, error.details, error.hint)
    throw new Error(`Supabase save failed: ${error.message}`)
  }
}

async function saveExperienceRecords(
  supabase: SupabaseClient,
  contactId: string,
  experiences: ExperienceInput[],
) {
  if (!experiences.length) return

  // Delete existing records for this contact to avoid duplicates on re-capture
  await supabase.from('linkedin_experience').delete().eq('contact_id', Number(contactId))

  const rows = experiences.map((exp, index) => ({
    contact_id: Number(contactId),
    company_name: exp.company || null,
    job_title: exp.title || null,
    duration_text: exp.duration || null,
    responsibilities: exp.responsibilities || null,
    is_current: exp.is_current || false,
    employment_type: exp.employment_type || null,
    location: exp.location || null,
    order_index: index,
    captured_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('linkedin_experience').insert(rows)
  if (error) {
    console.error('[capture-contact] Experience save error:', error.message)
    throw new Error(`Experience save failed: ${error.message}`)
  }
}

async function saveEducationRecords(
  supabase: SupabaseClient,
  contactId: string,
  education: EducationInput[],
) {
  if (!education.length) return

  await supabase.from('linkedin_education').delete().eq('contact_id', Number(contactId))

  const rows = education.map((edu, index) => ({
    contact_id: Number(contactId),
    institution: edu.institution || edu.university || 'Unknown',
    degree: edu.degree || null,
    field_of_study: edu.field_of_study || edu.field || null,
    order_index: index,
    captured_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('linkedin_education').insert(rows)
  if (error) {
    console.error('[capture-contact] Education save error:', error.message)
    throw new Error(`Education save failed: ${error.message}`)
  }
}

async function saveCertificationRecords(
  supabase: SupabaseClient,
  contactId: string,
  certifications: CertificationInput[],
) {
  if (!certifications.length) return

  await supabase.from('linkedin_certification').delete().eq('contact_id', Number(contactId))

  const rows = certifications.map((cert) => ({
    contact_id: Number(contactId),
    certification_name: cert.name || 'Unknown Certification',
    issuing_organization: cert.issuing_organization || null,
    captured_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('linkedin_certification').insert(rows)
  if (error) {
    console.error('[capture-contact] Certification save error:', error.message)
    throw new Error(`Certification save failed: ${error.message}`)
  }
}

function summarizePastExperienceText(experiences: ExperienceInput[]): string {
  const past = experiences.filter((exp) => !exp.is_current)
  if (!past.length) return ''

  return past
    .map((exp) => {
      const parts: string[] = []
      if (exp.title) parts.push(exp.title)
      if (exp.company) parts.push(`at ${exp.company}`)
      if (exp.duration) parts.push(`(${exp.duration})`)
      return parts.join(' ')
    })
    .filter(Boolean)
    .join('; ')
}

async function handleExtract(supabase: SupabaseClient, body: CaptureRequest) {
  const profile = normalizeProfile(body.profile)

  if (!profile.firstname || !profile.lastname || !profile.linkedin_url) {
    return NextResponse.json({ error: 'invalid_input', message: 'firstname, lastname, and linkedin_url are required' }, { status: 400 })
  }

  if (!isLinkedInProfileUrl(profile.linkedin_url)) {
    return NextResponse.json({ error: 'invalid_linkedin_url', message: 'URL must be a LinkedIn profile URL' }, { status: 400 })
  }

  let autoTags: ContactTags & { rules_fired: Array<{ rule: string; field: string; matched: string }> }
  try {
    autoTags = await classifyContact({
      headline: profile.headline,
      location: profile.location,
      about: profile.about,
      company_name: profile.company_name,
      education: profile.education,
    })
  } catch {
    autoTags = {
      ...DEFAULT_TAGS,
      rules_fired: [],
    }
  }

  const duplicateResponse = await supabase
    .from('hubspot_contacts')
    .select('contact_id, firstname, lastname, job_title, company_name, linkedin_url, network_roles, life_projects, metro_areas, focus_areas, imported_at')
    .eq('linkedin_url', profile.linkedin_url)
    .maybeSingle()

  const duplicate = (duplicateResponse.data || null) as ExistingContactRow | null

  const companyMatch = await resolveCompany({
    companyName: profile.company_name,
    createIfMissing: false,
  })

  const activeDeals = companyMatch.matched_company?.company_id
    ? await fetchActiveDealsForCompany(supabase, companyMatch.matched_company.company_id)
    : []

  if (duplicate?.contact_id) {
    await logCapture(supabase, {
      linkedin_url: profile.linkedin_url,
      status: 'duplicate',
      contact_id: duplicate.contact_id,
      auto_tags: autoTags,
      extraction_data: profile,
    }).catch(() => {
      // best-effort audit logging
    })
  }

  return NextResponse.json({
    success: true,
    parsed: {
      firstname: profile.firstname,
      lastname: profile.lastname,
      job_title: profile.job_title || '',
      company_name: profile.company_name || '',
      location: profile.location || '',
      linkedin_url: profile.linkedin_url,
      about: profile.about || '',
      connection_degree: profile.connection_degree || '',
      education: profile.education,
      experiences: body.profile?.experiences || [],
      certifications: body.profile?.certifications || [],
      captured_date: body.profile?.captured_date || null,
    },
    auto_tags: autoTags,
    company_match: {
      ...companyMatch,
      active_deals: activeDeals,
    },
    duplicate_check: {
      is_duplicate: Boolean(duplicate?.contact_id),
      existing_contact: duplicate,
    },
  })
}

async function handleConfirm(supabase: SupabaseClient, body: CaptureRequest) {
  const profile = normalizeProfile(body.profile)

  if (!profile.firstname || !profile.lastname || !profile.linkedin_url) {
    return NextResponse.json({ error: 'invalid_input', message: 'firstname, lastname, and linkedin_url are required' }, { status: 400 })
  }

  if (!isLinkedInProfileUrl(profile.linkedin_url)) {
    return NextResponse.json({ error: 'invalid_linkedin_url', message: 'URL must be a LinkedIn profile URL' }, { status: 400 })
  }

  const autoTags = await classifyContact({
    headline: profile.headline,
    location: profile.location,
    about: profile.about,
    company_name: profile.company_name,
    education: profile.education,
  }).catch(() => ({ ...DEFAULT_TAGS, rules_fired: [] }))

  const selectedTags = mergeTags(DEFAULT_TAGS, body.tags || {})
  const finalTags = mergeTags(selectedTags, autoTags)

  console.log('[capture-contact] Confirm profile:', JSON.stringify({
    firstname: profile.firstname,
    lastname: profile.lastname,
    company_name: profile.company_name,
    job_title: profile.job_title,
    headline: profile.headline,
    location: profile.location,
    linkedin_url: profile.linkedin_url,
  }))

  const company = await resolveCompany({
    providedCompanyId: body.company_id,
    companyName: profile.company_name,
    createIfMissing: true,
  })

  console.log('[capture-contact] Company resolution:', JSON.stringify({
    status: company.status,
    match_method: company.match_method,
    company_name: company.matched_company?.name || null,
    company_id: company.matched_company?.company_id || null,
  }))

  // Build past experience summary before HubSpot write
  const experiencesForSummary = body.profile?.experiences || []
  const pastExpSummary = summarizePastExperienceText(experiencesForSummary)

  // Attach summary and capture date to profile for HubSpot
  const enrichedProfile: ContactProfilePayload = {
    ...profile,
    past_experience_summary: pastExpSummary || null,
    captured_date: body.profile?.captured_date || null,
  }

  const existingHubSpot = await findHubSpotContactByLinkedIn(profile.linkedin_url)
  const contactWrite = await upsertHubSpotContact({
    profile: enrichedProfile,
    tags: finalTags,
    captureNotes: body.capture_notes,
    captureNextSteps: body.capture_next_steps,
    captureSource: 'Extension',
    existingContactId: existingHubSpot?.id || null,
  })

  await associateContactToCompanyAndDeal({
    contactId: contactWrite.contactId,
    companyId: company.matched_company?.company_id || null,
    dealId: body.link_deal_id || null,
  })

  const captureNotes = String(body.capture_notes || '').trim()
  const captureNextSteps = String(body.capture_next_steps || '').trim()

  let noteId: string | null = null
  if (captureNotes) {
    const noteResult = await createHubSpotNote({
      contactId: contactWrite.contactId,
      dealId: body.link_deal_id || null,
      body: captureNotes,
    })
    noteId = noteResult.noteId
  }

  let taskId: string | null = null
  let taskDueDate: string | null = null
  if (body.task?.enabled) {
    taskDueDate = computeDueDate(body.task)
    const subject = String(body.task.description || body.task.template || 'Follow up').trim() || 'Follow up'
    const taskResult = await createHubSpotTask({
      contactId: contactWrite.contactId,
      dealId: body.link_deal_id || null,
      subject,
      body: `${subject}${captureNotes ? `\n\nContext: ${captureNotes}` : ''}`,
      dueDate: taskDueDate,
      priority: body.task.priority || 'MEDIUM',
    })
    taskId = taskResult.taskId
  }

  let persistenceWarning: string | null = null

  try {
    await saveContactSnapshot(supabase, {
      contactId: contactWrite.contactId,
      profile,
      tags: finalTags,
      companyId: company.matched_company?.company_id || null,
      linkDealId: body.link_deal_id || null,
      taskId,
      taskDueDate,
      taskStatus: taskId ? 'open' : null,
      captureNotes,
      captureNextSteps,
      autoTagsApplied: autoTags,
      profileData: body.profile || {},
      importMethod: 'extension',
    })

    // Save captured_date and past_experience_summary on hubspot_contacts row
    if (body.profile?.captured_date || pastExpSummary) {
      await supabase
        .from('hubspot_contacts')
        .update({
          ...(body.profile?.captured_date ? { captured_date: body.profile.captured_date } : {}),
          ...(pastExpSummary ? { past_experience_summary: pastExpSummary } : {}),
        })
        .eq('contact_id', contactWrite.contactId)
    }

    // Save normalized records to new tables
    await saveExperienceRecords(supabase, contactWrite.contactId, experiencesForSummary)

    const educationArray = Array.isArray(body.profile?.education)
      ? body.profile.education
      : body.profile?.education
        ? [body.profile.education]
        : []
    await saveEducationRecords(supabase, contactWrite.contactId, educationArray)

    await saveCertificationRecords(
      supabase,
      contactWrite.contactId,
      body.profile?.certifications || [],
    )
  } catch (error: unknown) {
    persistenceWarning = `contact_snapshot_failed: ${getErrorMessage(error)}`
    console.error('[capture-contact] Supabase snapshot failed:', getErrorMessage(error))
  }

  await logCapture(supabase, {
    linkedin_url: profile.linkedin_url,
    status: 'success',
    contact_id: contactWrite.contactId,
    auto_tags: autoTags,
    user_tags: body.tags || {},
    extraction_data: body.profile || {},
    error_message: persistenceWarning,
  }).catch(() => {
    // best-effort audit logging
  })

  return NextResponse.json(
    {
      success: true,
      contact: {
        contact_id: contactWrite.contactId,
        company_id: company.matched_company?.company_id || null,
        company_matched: Boolean(company.matched_company?.company_id),
        deal_linked: Boolean(body.link_deal_id),
        deal_id: body.link_deal_id || null,
        tags_applied: finalTags,
        capture_notes: captureNotes || null,
        capture_next_steps: captureNextSteps || null,
        note_created: Boolean(noteId),
        task_created: Boolean(taskId),
        task_id: taskId,
        task_due_date: taskDueDate,
        hubspot_url: getHubSpotContactUrl(contactWrite.contactId),
        sync_warning: persistenceWarning,
      },
    },
    { status: 201 },
  )
}

function tagsFromRow(row: ContactListRow): ContactTags {
  return {
    network_roles: row.network_roles || [],
    life_projects: row.life_projects || [],
    metro_areas: row.metro_areas || [],
    focus_areas: row.focus_areas || [],
  }
}

async function handleUpdate(supabase: SupabaseClient, body: UpdateRequest) {
  const contactId = String(body.contact_id || '').trim()
  if (!contactId) {
    return NextResponse.json({ error: 'invalid_input', message: 'contact_id is required' }, { status: 400 })
  }

  const existingResp = await supabase
    .from('hubspot_contacts')
    .select('contact_id, firstname, lastname, email, phone, job_title, company_name, location, linkedin_url, linkedin_headline, linkedin_about, connection_degree, education_university, education_degree, education_field, network_roles, life_projects, metro_areas, focus_areas')
    .eq('contact_id', contactId)
    .maybeSingle()

  if (existingResp.error || !existingResp.data) {
    return NextResponse.json({ error: 'not_found', message: 'Contact not found' }, { status: 404 })
  }

  const row = existingResp.data as Record<string, unknown>
  const mergedProfile: ContactProfilePayload = {
    firstname: String(body.updates?.firstname || row.firstname || '').trim(),
    lastname: String(body.updates?.lastname || row.lastname || '').trim(),
    email: String(body.updates?.email || row.email || '').trim() || null,
    phone: String(body.updates?.phone || row.phone || '').trim() || null,
    job_title: String(body.updates?.job_title || row.job_title || '').trim() || null,
    company_name: String(body.updates?.company_name || row.company_name || '').trim() || null,
    location: String(body.updates?.location || row.location || '').trim() || null,
    linkedin_url: normalizeLinkedInUrl(String(body.updates?.linkedin_url || row.linkedin_url || '')),
    headline: String(body.updates?.headline || row.linkedin_headline || '').trim() || null,
    about: String(body.updates?.about || row.linkedin_about || '').trim() || null,
    connection_degree: String(body.updates?.connection_degree || row.connection_degree || '').trim() || null,
    education: {
      university: String((body.updates?.education as EducationInput | undefined)?.university || row.education_university || '').trim() || null,
      degree: String((body.updates?.education as EducationInput | undefined)?.degree || row.education_degree || '').trim() || null,
      field: String((body.updates?.education as EducationInput | undefined)?.field || row.education_field || '').trim() || null,
    },
  }

  const mergedTags = mergeTags(
    {
      network_roles: asArray(row.network_roles),
      life_projects: asArray(row.life_projects),
      metro_areas: asArray(row.metro_areas),
      focus_areas: asArray(row.focus_areas),
    },
    body.add_tags || {},
  )

  await upsertHubSpotContact({
    profile: mergedProfile,
    tags: mergedTags,
    captureNotes: body.capture_notes,
    captureNextSteps: body.capture_next_steps,
    captureSource: 'Admin Console',
    existingContactId: contactId,
  })

  await associateContactToCompanyAndDeal({
    contactId,
    dealId: body.link_deal_id || null,
  })

  let taskId: string | null = null
  let taskDueDate: string | null = null
  if (body.task?.enabled) {
    taskDueDate = computeDueDate(body.task)
    const subject = String(body.task.description || body.task.template || 'Follow up').trim() || 'Follow up'
    taskId = (await createHubSpotTask({
      contactId,
      dealId: body.link_deal_id || null,
      subject,
      body: `${subject}${body.capture_notes ? `\n\nContext: ${body.capture_notes}` : ''}`,
      dueDate: taskDueDate,
      priority: body.task.priority || 'MEDIUM',
    })).taskId
  }

  if (body.capture_notes) {
    await createHubSpotNote({
      contactId,
      dealId: body.link_deal_id || null,
      body: body.capture_notes,
    })
  }

  await saveContactSnapshot(supabase, {
    contactId,
    profile: mergedProfile,
    tags: mergedTags,
    linkDealId: body.link_deal_id || null,
    taskId,
    taskDueDate,
    taskStatus: taskId ? 'open' : null,
    captureNotes: body.capture_notes || null,
    captureNextSteps: body.capture_next_steps || null,
    importMethod: 'admin_console',
  })

  await logCapture(supabase, {
    linkedin_url: mergedProfile.linkedin_url,
    status: 'updated',
    contact_id: contactId,
    user_tags: body.add_tags || {},
    extraction_data: body.updates || {},
  }).catch(() => {
    // best-effort audit logging
  })

  return NextResponse.json({
    success: true,
    contact: {
      contact_id: contactId,
      tags_added: body.add_tags || {},
      deal_linked: Boolean(body.link_deal_id),
      capture_notes: body.capture_notes || null,
      capture_next_steps: body.capture_next_steps || null,
      task_created: Boolean(taskId),
      task_id: taskId,
      task_due_date: taskDueDate,
    },
  })
}

export async function GET(req: Request) {
  try {
    const supabase = requireAdminSupabaseClient()
    const url = new URL(req.url)

    const q = String(url.searchParams.get('q') || '').trim().toLowerCase()
    const networkRole = String(url.searchParams.get('network_role') || '').trim().toLowerCase()
    const lifeProject = String(url.searchParams.get('life_project') || '').trim().toLowerCase()
    const metroArea = String(url.searchParams.get('metro_area') || '').trim().toLowerCase()
    const taskStatus = String(url.searchParams.get('task_status') || '').trim().toLowerCase()
    const dateRange = String(url.searchParams.get('date_range') || 'all').trim().toLowerCase()

    const response = await supabase
      .from('hubspot_contacts')
      .select('contact_id, firstname, lastname, job_title, company_name, linkedin_url, location, network_roles, life_projects, metro_areas, focus_areas, task_status, task_due_date, imported_at, capture_notes, capture_next_steps')
      .order('imported_at', { ascending: false })
      .limit(500)

    if (response.error) {
      return NextResponse.json({ error: response.error.message }, { status: 500 })
    }

    const now = Date.now()
    const rows = ((response.data || []) as ContactListRow[]).filter((row) => {
      const fullName = `${row.firstname || ''} ${row.lastname || ''}`.trim().toLowerCase()
      const company = String(row.company_name || '').toLowerCase()
      if (q && !`${fullName} ${company}`.includes(q)) return false

      const tags = tagsFromRow(row)

      if (networkRole && !tags.network_roles.some((value) => value.toLowerCase() === networkRole)) return false
      if (lifeProject && !tags.life_projects.some((value) => value.toLowerCase() === lifeProject)) return false
      if (metroArea && !tags.metro_areas.some((value) => value.toLowerCase() === metroArea)) return false

      if (taskStatus === 'pending') {
        if (!row.task_due_date) return false
        const due = new Date(row.task_due_date).getTime()
        if (!Number.isFinite(due) || due < now) return false
      }

      if (taskStatus === 'overdue') {
        if (!row.task_due_date) return false
        const due = new Date(row.task_due_date).getTime()
        if (!Number.isFinite(due) || due >= now) return false
      }

      if (taskStatus === 'completed' && String(row.task_status || '').toLowerCase() !== 'completed') return false

      if (dateRange === '7d' || dateRange === '30d') {
        const days = dateRange === '7d' ? 7 : 30
        const importedAt = new Date(String(row.imported_at || '')).getTime()
        if (!Number.isFinite(importedAt) || now - importedAt > days * 24 * 60 * 60 * 1000) return false
      }

      return true
    })

    const stats = {
      total: rows.length,
      recent_30d: rows.filter((row) => {
        const importedAt = new Date(String(row.imported_at || '')).getTime()
        return Number.isFinite(importedAt) && now - importedAt <= 30 * 24 * 60 * 60 * 1000
      }).length,
      by_network_role: rows.reduce<Record<string, number>>((accumulator, row) => {
        for (const role of row.network_roles || []) {
          accumulator[role] = (accumulator[role] || 0) + 1
        }
        return accumulator
      }, {}),
      by_life_project: rows.reduce<Record<string, number>>((accumulator, row) => {
        for (const project of row.life_projects || []) {
          accumulator[project] = (accumulator[project] || 0) + 1
        }
        return accumulator
      }, {}),
    }

    return NextResponse.json({
      success: true,
      contacts: rows,
      stats,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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
    const supabase = requireAdminSupabaseClient()
    const body = (await req.json().catch(() => ({}))) as CaptureRequest
    const mode = body.mode || 'extract'

    if (mode === 'extract') {
      return withCors(await handleExtract(supabase, body))
    }

    if (mode === 'confirm') {
      return withCors(await handleConfirm(supabase, body))
    }

    return withCors(NextResponse.json({ error: 'invalid_mode', message: 'mode must be extract or confirm' }, { status: 400 }))
  } catch (error: unknown) {
    console.error('[capture-contact] POST error:', error)
    return withCors(NextResponse.json({ error: 'capture_failed', message: getErrorMessage(error) }, { status: 500 }))
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = requireAdminSupabaseClient()
    const body = (await req.json().catch(() => ({}))) as UpdateRequest

    return withCors(await handleUpdate(supabase, body))
  } catch (error: unknown) {
    return withCors(NextResponse.json({ error: 'update_failed', message: getErrorMessage(error) }, { status: 500 }))
  }
}
