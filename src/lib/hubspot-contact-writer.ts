import 'server-only'

import {
  associateHubSpotObjects,
  createHubSpotObject,
  hubspotSearchObjects,
  updateHubSpotObject,
} from '@/lib/hubspot-api'

export type ContactTagSelection = {
  network_roles: string[]
  life_projects: string[]
  metro_areas: string[]
  focus_areas: string[]
}

export type ContactEducation = {
  university?: string | null
  degree?: string | null
  field?: string | null
}

export type ContactProfilePayload = {
  firstname: string
  lastname: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  company_name?: string | null
  location?: string | null
  linkedin_url: string
  headline?: string | null
  about?: string | null
  connection_degree?: string | null
  education?: ContactEducation | null
  past_experience_summary?: string | null
  captured_date?: string | null
}

type ContactProperties = Record<string, string>

type UpsertContactResult = {
  contactId: string
  created: boolean
}

const NETWORK_ROLE_MAP: Record<string, string> = {
  associate: 'associate',
  'community organizer': 'community_organizer',
  connector: 'connector',
  entrepreneur: 'entrepreneur',
  friend: 'friend',
  'friend+': 'friend_',
  'friend +': 'friend_',
  'hiring manager': 'hiring_manager',
  'subject matter expert': 'subject_matter_expert',
  'talent acquisition': 'talent_acquisition',
}

const LIFE_PROJECT_MAP: Record<string, string> = {
  'baseball community': 'baseball_community',
  'bay area connectors': 'bay_area_connectors',
  'bay area organizers': 'bay_area_organizers',
  'entrepreneurial society': 'entrepreneurial_society',
  'fog city fans': 'fog_city_fans',
  'friends + associates': 'friends___associates',
  'friends/associates': 'friends___associates',
  'greener horizons': 'greener_horizons',
  techhustle: 'techhustle',
  'usc alumni': 'usc_alumni',
  'warm data': 'warm_data',
}

function cityFromLocation(location: string | null | undefined): string {
  const text = String(location || '').trim()
  if (!text) return ''
  return text.split(',')[0]?.trim() || text
}

function normalizeTag(value: string): string {
  return String(value || '').toLowerCase().trim()
}

function splitNameParts(location: string | null | undefined): { city: string; state: string } {
  const text = String(location || '').trim()
  if (!text) return { city: '', state: '' }
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length === 1) return { city: parts[0], state: '' }
  return { city: parts[0], state: parts[1] }
}

function toHubspotMultiCheckbox(values: string[]): string {
  return values.map((value) => String(value || '').trim()).filter(Boolean).join(';')
}

function mapBooleanTags(values: string[], map: Record<string, string>): ContactProperties {
  const result: ContactProperties = {}

  for (const raw of values) {
    const key = map[normalizeTag(raw)]
    if (!key) continue
    result[key] = 'true'
  }

  return result
}

function buildContactProperties(params: {
  profile: ContactProfilePayload
  tags: ContactTagSelection
  captureNotes?: string
  captureNextSteps?: string
  captureSource: 'Extension' | 'Admin Console' | 'API'
}): ContactProperties {
  const profile = params.profile
  const tags = params.tags
  const stateLocation = splitNameParts(profile.location)

  return {
    firstname: profile.firstname,
    lastname: profile.lastname,
    ...(profile.email ? { email: profile.email } : {}),
    ...(profile.phone ? { phone: profile.phone } : {}),
    ...(profile.job_title ? { jobtitle: profile.job_title } : {}),
    ...(profile.company_name ? { company: profile.company_name } : {}),
    ...(cityFromLocation(profile.location) ? { city: cityFromLocation(profile.location) } : {}),
    ...(stateLocation.state ? { state: stateLocation.state } : {}),

    hs_linkedin_url: profile.linkedin_url,
    linkedin_headline: profile.headline || '',
    linkedin_about: profile.about || '',
    linkedin_connection_degree: profile.connection_degree || '',
    linkedin_education_university: profile.education?.university || '',
    linkedin_education_degree: profile.education?.degree || '',
    linkedin_education_field: profile.education?.field || '',
    capture_notes: params.captureNotes || '',
    capture_next_steps: params.captureNextSteps || '',
    contact_capture_source: params.captureSource,
    captured_at: new Date().toISOString().slice(0, 10),
    ...(profile.past_experience_summary ? { linkedin_past_experience_summary: profile.past_experience_summary } : {}),
    ...(profile.captured_date ? { linkedin_capture_date: profile.captured_date.slice(0, 10) } : {}),

    ...mapBooleanTags(tags.network_roles, NETWORK_ROLE_MAP),
    ...mapBooleanTags(tags.life_projects, LIFE_PROJECT_MAP),
    ...(tags.metro_areas.length ? { metro_area: toHubspotMultiCheckbox(tags.metro_areas) } : {}),
    ...(tags.focus_areas.length ? { focus_areas: toHubspotMultiCheckbox(tags.focus_areas) } : {}),
  }
}

export async function findHubSpotContactByLinkedIn(linkedinUrl: string): Promise<{ id: string } | null> {
  const rows = await hubspotSearchObjects<Record<string, unknown>>('contacts', {
    filterGroups: [{ filters: [{ propertyName: 'hs_linkedin_url', operator: 'EQ', value: linkedinUrl }] }],
    properties: ['hs_linkedin_url'],
    limit: 1,
  })

  const first = rows[0]
  if (!first?.id) return null
  return { id: first.id }
}

export async function upsertHubSpotContact(params: {
  profile: ContactProfilePayload
  tags: ContactTagSelection
  captureNotes?: string
  captureNextSteps?: string
  captureSource: 'Extension' | 'Admin Console' | 'API'
  existingContactId?: string | null
}): Promise<UpsertContactResult> {
  const properties = buildContactProperties(params)
  const contactId = String(params.existingContactId || '').trim()

  if (contactId) {
    await updateHubSpotObject('contacts', contactId, properties)
    return { contactId, created: false }
  }

  const created = await createHubSpotObject('contacts', properties)
  return { contactId: created.id, created: true }
}

export async function associateContactToCompanyAndDeal(params: {
  contactId: string
  companyId?: string | null
  dealId?: string | null
}) {
  if (params.companyId) {
    await associateHubSpotObjects({
      fromObjectType: 'contacts',
      fromObjectId: params.contactId,
      toObjectType: 'companies',
      toObjectId: params.companyId,
    })
  }

  if (params.dealId) {
    await associateHubSpotObjects({
      fromObjectType: 'contacts',
      fromObjectId: params.contactId,
      toObjectType: 'deals',
      toObjectId: params.dealId,
    })
  }
}
