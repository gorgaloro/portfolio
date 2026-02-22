#!/usr/bin/env node
/*
Usage:
  SUPABASE_SERVICE_ROLE_KEY=... node scripts/mark-active-from-csv.js "Selected Grid copy.csv"

Updates public.company_profiles.active=true for Company IDs listed in the CSV.
Requires:
  - SUPABASE_SERVICE_ROLE_KEY (server key)
  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
Optional envs to match your schema:
  - SUPABASE_COMPANY_TABLE (default: company_profiles)
  - SUPABASE_COMPANY_ID_COLUMN (default: company_id)
*/

const fs = require('fs')
const path = require('path')

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const TABLE = process.env.SUPABASE_COMPANY_TABLE || 'company_profiles'
const ID_COL = process.env.SUPABASE_COMPANY_ID_COLUMN || 'company_id'

if (!SERVICE_KEY || !BASE_URL) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL in env')
  process.exit(1)
}

const csvPath = process.argv[2] || 'Selected Grid copy.csv'
const absPath = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath)
if (!fs.existsSync(absPath)) {
  console.error('CSV not found at', absPath)
  process.exit(1)
}

function parseCsvRow(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'; i++ // escaped quote
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === ',') { out.push(cur); cur = '' }
      else if (ch === '"') { inQuotes = true }
      else { cur += ch }
    }
  }
  out.push(cur)
  return out.map(s => s.trim())
}

const text = fs.readFileSync(absPath, 'utf8')
const lines = text.split(/\r?\n/).filter(Boolean)
if (lines.length === 0) {
  console.error('CSV is empty')
  process.exit(1)
}
const header = parseCsvRow(lines[0])
const idIndex = header.findIndex(h => /company\s*id/i.test(h))
if (idIndex === -1) {
  console.error('Could not find a "Company ID" column in header:', header)
  process.exit(1)
}

const ids = new Set()
for (let i = 1; i < lines.length; i++) {
  const row = parseCsvRow(lines[i])
  const id = row[idIndex]
  if (id) ids.add(id)
}

const idList = Array.from(ids)
console.log(`Found ${idList.length} unique Company IDs to activate.`)

async function patchChunk(chunk) {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(TABLE)}`)
  // PostgREST in.() filter. UUIDs usually don't need quotes; encode just in case.
  url.searchParams.set(`${ID_COL}`, `in.(${chunk.join(',')})`)
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ active: true }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`PATCH failed: ${res.status} ${res.statusText} -> ${txt}`)
  }
}

async function main() {
  const chunkSize = 50
  for (let i = 0; i < idList.length; i += chunkSize) {
    const chunk = idList.slice(i, i + chunkSize)
    process.stdout.write(`Updating ${i + 1}-${Math.min(i + chunkSize, idList.length)}... `)
    await patchChunk(chunk)
    console.log('OK')
  }
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
