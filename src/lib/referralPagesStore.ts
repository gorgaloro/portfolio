import fs from 'node:fs/promises'
import path from 'node:path'

export type ReferralPageRecord = {
  slug: string
  company_id: number
  company_name?: string | null
  pipeline_id?: string | null
  deal_ids?: number[] | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

const STORE_DIR = path.join(process.cwd(), 'tmp')
const STORE_PATH = path.join(STORE_DIR, 'referral-pages.json')

async function ensureDir() {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

export async function readReferralPageStore(): Promise<ReferralPageRecord[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch (err: any) {
    if (err?.code === 'ENOENT') return []
    console.error('Failed to read referral page store', err)
    return []
  }
}

async function writeStore(rows: ReferralPageRecord[]) {
  await ensureDir()
  await fs.writeFile(STORE_PATH, JSON.stringify(rows, null, 2), 'utf8')
}

export async function saveReferralPage(record: ReferralPageRecord) {
  const rows = await readReferralPageStore()
  const next = rows.filter((r) => r.slug !== record.slug)
  const timestamp = new Date().toISOString()
  next.push({ ...record, created_at: record.created_at || timestamp, updated_at: timestamp })
  await writeStore(next)
}

export async function getReferralPageFromStore(slug: string): Promise<ReferralPageRecord | null> {
  const rows = await readReferralPageStore()
  return rows.find((r) => r.slug === slug) || null
}

export async function referralPageSlugExists(slug: string): Promise<boolean> {
  const rows = await readReferralPageStore()
  return rows.some((r) => r.slug === slug)
}
