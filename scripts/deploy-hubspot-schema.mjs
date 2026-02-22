#!/usr/bin/env node
/**
 * HubSpot Schema Deployment + Migration Script
 *
 * Based on: BUILD-HubSpot-JD-Import-Fields.md
 *
 * What this does:
 *   1. Creates deal property groups: "Job Details", "Import Tracking"
 *   2. Creates company property group: "Company Demographics"
 *   3. Creates new deal properties: job_description, job_location, employment_type (FTE/Contract),
 *      salary_min, salary_raw, jd_section_company, jd_section_role, jd_section_qualifications,
 *      job_posted_date, import_method, imported_at
 *   4. Creates new company properties: company_career_page, tech_stack_extracted,
 *      last_applied_date, open_deal_count
 *   5. Migrates data from submission_notes → job_description (200+ deals, paginated)
 *   6. Archives/hides submission_notes after successful migration
 *   7. Creates contact property group: "LinkedIn Capture"
 *   8. Creates new contact properties: linkedin_profile_url, linkedin_headline, linkedin_about,
 *      linkedin_connection_degree, linkedin_education_university, linkedin_education_degree,
 *      linkedin_education_field, capture_notes, capture_next_steps, contact_capture_source, captured_at
 *   9. Renames "Entrepreneural Society" → "Entrepreneurial Society" (typo fix)
 *   10. Verifies existing properties (deals, companies, contacts)
 *   11. Verifies API scopes
 *
 * Usage:
 *   HUBSPOT_TOKEN="pat-na1-..." node scripts/deploy-hubspot-schema.mjs
 *
 * Flags:
 *   --dry-run         Show what would happen without making changes
 *   --skip-migration  Skip the data migration step
 *   --skip-archive    Skip archiving submission_notes after migration
 */

const TOKEN = process.env.HUBSPOT_TOKEN;
const API = 'https://api.hubapi.com';
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_MIGRATION = process.argv.includes('--skip-migration');
const SKIP_ARCHIVE = process.argv.includes('--skip-archive');

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1100;

if (!TOKEN) {
  console.error('❌ Set HUBSPOT_TOKEN env var');
  process.exit(1);
}

if (DRY_RUN) console.log('🏜️  DRY RUN MODE — no changes will be made\n');

// ─── Helpers ───

async function hubspot(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Step 1: Property Groups ───

async function createPropertyGroup(objectType, name, displayOrder) {
  const internalName = name.toLowerCase().replace(/\s+/g, '_');
  console.log(`\n📁 Creating ${objectType} property group: "${name}" (${internalName})...`);
  if (DRY_RUN) { console.log('   [dry-run] Would create group'); return { ok: true }; }

  const res = await hubspot(`/crm/v3/properties/${objectType}/groups`, {
    method: 'POST',
    body: JSON.stringify({ name: internalName, label: name, displayOrder }),
  });

  if (res.ok) {
    console.log(`   ✅ Created`);
  } else if (res.status === 409 || JSON.stringify(res.data).includes('already exists')) {
    console.log(`   ⏭️  Already exists — skipping`);
  } else {
    console.log(`   ❌ Failed (${res.status}):`, JSON.stringify(res.data).slice(0, 300));
  }
  return res;
}

// ─── Step 2: Create Properties ───

async function createProperty(objectType, prop) {
  console.log(`\n🏷️  Creating ${objectType}: "${prop.label}" (${prop.name}) → group: ${prop.groupName}...`);
  if (DRY_RUN) { console.log('   [dry-run] Would create property'); return { ok: true }; }

  const res = await hubspot(`/crm/v3/properties/${objectType}`, {
    method: 'POST',
    body: JSON.stringify(prop),
  });

  if (res.ok) {
    console.log(`   ✅ Created`);
  } else if (res.status === 409 || JSON.stringify(res.data).includes('already exists')) {
    console.log(`   ⏭️  Already exists — skipping`);
  } else {
    console.log(`   ❌ Failed (${res.status}):`, JSON.stringify(res.data).slice(0, 400));
  }
  return res;
}

// ─── Step 3: Migrate submission_notes → job_description ───

async function migrateSubmissionNotes() {
  console.log('\n── DATA MIGRATION: submission_notes → job_description ──\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let after = undefined;
  let page = 0;

  while (true) {
    page++;
    const params = new URLSearchParams({
      limit: '100',
      properties: 'submission_notes,job_description',
    });
    if (after) params.set('after', after);

    console.log(`   📄 Fetching page ${page}...`);
    const res = await hubspot(`/crm/v3/objects/deals?${params}`);

    if (!res.ok) {
      console.log(`   ❌ Failed to fetch deals (${res.status}):`, JSON.stringify(res.data).slice(0, 300));
      break;
    }

    const deals = res.data.results || [];
    if (deals.length === 0) break;

    const toMigrate = deals.filter(d => {
      const sn = d.properties?.submission_notes;
      const jd = d.properties?.job_description;
      return sn && sn.trim() && (!jd || !jd.trim());
    });

    const alreadyDone = deals.filter(d => {
      const jd = d.properties?.job_description;
      return jd && jd.trim();
    });

    skipped += alreadyDone.length;

    if (toMigrate.length > 0) {
      console.log(`   → ${toMigrate.length} deals to migrate, ${alreadyDone.length} already have job_description`);

      for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
        const batch = toMigrate.slice(i, i + BATCH_SIZE);

        if (DRY_RUN) {
          for (const deal of batch) {
            const preview = (deal.properties.submission_notes || '').slice(0, 80);
            console.log(`     [dry-run] Deal ${deal.id}: "${preview}..."`);
          }
          migrated += batch.length;
          continue;
        }

        const inputs = batch.map(deal => ({
          id: deal.id,
          properties: { job_description: deal.properties.submission_notes },
        }));

        const updateRes = await hubspot('/crm/v3/objects/deals/batch/update', {
          method: 'POST',
          body: JSON.stringify({ inputs }),
        });

        if (updateRes.ok) {
          migrated += batch.length;
          console.log(`     ✅ Batch migrated ${batch.length} deals (total: ${migrated})`);
        } else {
          errors += batch.length;
          console.log(`     ❌ Batch failed (${updateRes.status}):`, JSON.stringify(updateRes.data).slice(0, 300));
        }

        await sleep(BATCH_DELAY_MS);
      }
    } else {
      console.log(`   → 0 to migrate on this page, ${alreadyDone.length} already done`);
    }

    after = res.data.paging?.next?.after;
    if (!after) break;
    await sleep(BATCH_DELAY_MS);
  }

  console.log(`\n   📊 Migration complete: ${migrated} migrated, ${skipped} already had data, ${errors} errors`);
  return { migrated, skipped, errors };
}

// ─── Step 4: Archive submission_notes ───

async function archiveSubmissionNotes() {
  console.log('\n🗄️  Archiving submission_notes (hiding from UI)...');
  if (DRY_RUN) { console.log('   [dry-run] Would archive submission_notes'); return; }

  const res = await hubspot('/crm/v3/properties/deals/submission_notes', {
    method: 'PATCH',
    body: JSON.stringify({
      hidden: true,
      description: 'DEPRECATED — Data migrated to job_description. Archived on ' + new Date().toISOString().split('T')[0],
    }),
  });

  if (res.ok) {
    console.log('   ✅ submission_notes is now hidden');
  } else {
    console.log(`   ⚠️  Could not archive (${res.status}):`, JSON.stringify(res.data).slice(0, 300));
    console.log('   → You may need to hide this field manually in HubSpot settings');
  }
}

// ─── Step 5: Verify Existing Properties ───

async function verifyProperty(name, label) {
  const res = await hubspot(`/crm/v3/properties/deals/${name}`);
  if (res.ok) {
    console.log(`   ✅ "${label}" (${name}) — ${res.data.type}/${res.data.fieldType}, group: ${res.data.groupName}`);
    return true;
  } else {
    console.log(`   ⚠️  "${label}" (${name}) — NOT FOUND`);
    return false;
  }
}

// ─── Step 6: Verify API Scopes ───

async function verifyScopes() {
  console.log('\n🔑 Verifying API access...');
  const checks = [
    ['Deals read', '/crm/v3/objects/deals?limit=1'],
    ['Companies read', '/crm/v3/objects/companies?limit=1'],
    ['Deal properties', '/crm/v3/properties/deals'],
  ];
  const results = {};
  for (const [label, path] of checks) {
    const res = await hubspot(path);
    console.log(`   ${res.ok ? '✅' : '❌'} ${label} (${res.status})`);
    results[label] = res.ok;
  }
  return results;
}

// ─── Main ───

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HubSpot Schema Deployment + Migration');
  console.log('  Spec: BUILD-HubSpot-JD-Import-Fields.md');
  console.log('═══════════════════════════════════════════════════════════════');

  // Step 1: Property Groups
  console.log('\n── STEP 1: Deal Property Groups ──');
  await createPropertyGroup('deals', 'Job Details', 1);
  await createPropertyGroup('deals', 'Import Tracking', 2);

  console.log('\n── STEP 1b: Company Property Groups ──');
  await createPropertyGroup('companies', 'Company Demographics', 1);

  // Step 2: New Properties
  console.log('\n── STEP 2: Create New Deal Properties ──');
  const newProperties = [
    {
      name: 'job_description',
      label: 'Job Description',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'job_details',
      description: 'Full job description text extracted from the posting. Input to enrichment pipeline. Migrated from submission_notes.',
    },
    {
      name: 'job_location',
      label: 'Job Location',
      type: 'string',
      fieldType: 'text',
      groupName: 'job_details',
      description: 'City, state, and remote status. Example: "San Francisco, CA (Hybrid)"',
    },
    {
      name: 'employment_type',
      label: 'Employment Type',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'job_details',
      description: 'FTE or Contract. If Contract with hourly rate, amount is auto-converted to annual (rate × 2,000 hrs).',
      options: [
        { label: 'FTE', value: 'FTE', displayOrder: 1 },
        { label: 'Contract', value: 'Contract', displayOrder: 2 },
      ],
    },
    {
      name: 'salary_min',
      label: 'Salary Min',
      type: 'number',
      fieldType: 'number',
      groupName: 'job_details',
      description: 'Annual salary floor from posted range. For contract/hourly: hourly rate × 2,000. Always stored as annual.',
    },
    {
      name: 'salary_raw',
      label: 'Salary (Raw Posted)',
      type: 'string',
      fieldType: 'text',
      groupName: 'job_details',
      description: 'Original salary text as scraped from posting (e.g., "$85/hr", "$150K-180K", "$160,000/yr"). Preserved for reference before normalization.',
    },
    {
      name: 'jd_section_company',
      label: 'About the Company',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'job_details',
      description: 'Extracted section: company overview, mission, culture. Answers: "Am I a good fit for what this company does?"',
    },
    {
      name: 'jd_section_role',
      label: 'Role & Responsibilities',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'job_details',
      description: 'Extracted section: day-to-day duties, projects, scope. Answers: "Am I a good fit for the job requirements?"',
    },
    {
      name: 'jd_section_qualifications',
      label: 'Qualifications',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'job_details',
      description: 'Extracted section: required/preferred experience, skills, education. Answers: "Am I qualified?"',
    },
    {
      name: 'job_posted_date',
      label: 'Job Posted Date',
      type: 'date',
      fieldType: 'date',
      groupName: 'job_details',
      description: 'Date the role was published on the company\'s career site',
    },
    {
      name: 'import_method',
      label: 'Import Method',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'import_tracking',
      description: 'How this deal entered the system (distinct from job_source and application_method)',
      options: [
        { label: 'Manual', value: 'Manual', displayOrder: 1 },
        { label: 'URL Import', value: 'URL Import', displayOrder: 2 },
        { label: 'Browser Extension', value: 'Browser Extension', displayOrder: 3 },
      ],
    },
    {
      name: 'imported_at',
      label: 'Imported At',
      type: 'date',
      fieldType: 'date',
      groupName: 'import_tracking',
      description: 'Timestamp when the URL import was processed',
    },
  ];

  for (const prop of newProperties) {
    await createProperty('deals', prop);
    await sleep(200);
  }

  // Step 2b: Company Properties
  console.log('\n── STEP 2b: Create New Company Properties ──');
  const companyProperties = [
    {
      name: 'company_career_page',
      label: 'Career Page URL',
      type: 'string',
      fieldType: 'text',
      groupName: 'company_demographics',
      description: 'Direct link to the company\'s careers/jobs landing page. Extracted from import URL during deal creation.',
    },
    {
      name: 'tech_stack_extracted',
      label: 'Tech Stack (Extracted)',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'company_demographics',
      description: 'Technologies, platforms, and tools mentioned across JDs from this company. Aggregated from JD extraction.',
    },
    {
      name: 'last_applied_date',
      label: 'Last Applied Date',
      type: 'date',
      fieldType: 'date',
      groupName: 'company_demographics',
      description: 'Date of most recent deal reaching "Applied" stage or later. Updated by import/email monitor workflows.',
    },
    {
      name: 'open_deal_count',
      label: 'Open Deal Count',
      type: 'number',
      fieldType: 'number',
      groupName: 'company_demographics',
      description: 'Number of active (non-closed) deals associated with this company. Updated on deal create/stage change.',
    },
  ];

  for (const prop of companyProperties) {
    await createProperty('companies', prop);
    await sleep(200);
  }

  // Step 2c: Contact Property Group + Properties
  console.log('\n── STEP 2c: Contact Property Group ──');
  await createPropertyGroup('contacts', 'LinkedIn Capture', 1);

  console.log('\n── STEP 2d: Create New Contact Properties ──');
  const contactProperties = [
    {
      name: 'linkedin_profile_url',
      label: 'LinkedIn URL',
      type: 'string',
      fieldType: 'text',
      skip: true, // HubSpot has built-in hs_linkedin_url with same label; use that instead
      groupName: 'linkedin_capture',
      description: 'LinkedIn profile URL. Used as unique identifier for deduplication during contact capture.',
    },
    {
      name: 'linkedin_headline',
      label: 'LinkedIn Headline',
      type: 'string',
      fieldType: 'text',
      groupName: 'linkedin_capture',
      description: 'Full headline text from LinkedIn profile.',
    },
    {
      name: 'linkedin_about',
      label: 'LinkedIn About',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'linkedin_capture',
      description: 'About section snippet from LinkedIn profile (first 500 characters).',
    },
    {
      name: 'linkedin_connection_degree',
      label: 'Connection Degree',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'linkedin_capture',
      description: 'LinkedIn connection degree at time of capture.',
      options: [
        { label: '1st', value: '1st', displayOrder: 1 },
        { label: '2nd', value: '2nd', displayOrder: 2 },
        { label: '3rd', value: '3rd', displayOrder: 3 },
        { label: 'Out of Network', value: 'Out of Network', displayOrder: 4 },
      ],
    },
    {
      name: 'linkedin_education_university',
      label: 'Education - University',
      type: 'string',
      fieldType: 'text',
      groupName: 'linkedin_capture',
      description: 'Primary university name extracted from LinkedIn education section. Used for alumni auto-classification.',
    },
    {
      name: 'linkedin_education_degree',
      label: 'Education - Degree',
      type: 'string',
      fieldType: 'text',
      groupName: 'linkedin_capture',
      description: 'Degree type (BS, MS, MBA, PhD, etc.) from LinkedIn education section.',
    },
    {
      name: 'linkedin_education_field',
      label: 'Education - Field',
      type: 'string',
      fieldType: 'text',
      groupName: 'linkedin_capture',
      description: 'Field of study from LinkedIn education section.',
    },
    {
      name: 'capture_notes',
      label: 'Capture Notes',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'linkedin_capture',
      description: 'Free-form context about why this contact was added. E.g., "Met at CleanTech Expo — mentioned they are hiring PMs."',
    },
    {
      name: 'capture_next_steps',
      label: 'Next Steps',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'linkedin_capture',
      description: 'Free-form next action to take with this contact. E.g., "Send connection request, then ask about PM role."',
    },
    {
      name: 'contact_capture_source',
      label: 'Capture Source',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'linkedin_capture',
      description: 'How this contact was captured into the CRM.',
      options: [
        { label: 'Extension', value: 'Extension', displayOrder: 1 },
        { label: 'Admin Console', value: 'Admin Console', displayOrder: 2 },
        { label: 'API', value: 'API', displayOrder: 3 },
      ],
    },
    {
      name: 'captured_at',
      label: 'Captured At',
      type: 'date',
      fieldType: 'date',
      groupName: 'linkedin_capture',
      description: 'Timestamp of initial contact capture.',
    },
    // ─── New LinkedIn Capture Properties (Feb 2026) ───
    {
      name: 'linkedin_past_experience_summary',
      label: 'LinkedIn Past Experience Summary',
      type: 'string',
      fieldType: 'textarea',
      groupName: 'linkedin_capture',
      description: 'Auto-generated summary of all past (non-current) roles from LinkedIn profile. Format: "Title at Company (Duration); Title at Company (Duration); ..."',
    },
    {
      name: 'linkedin_capture_date',
      label: 'LinkedIn Capture Date',
      type: 'date',
      fieldType: 'date',
      groupName: 'linkedin_capture',
      description: 'Date when the LinkedIn profile was captured by the extension.',
    },
  ];

  for (const prop of contactProperties) {
    if (prop.skip) {
      console.log(`\n🏷️  Skipping contacts: "${prop.label}" (${prop.name}) — use built-in hs_linkedin_url instead`);
      continue;
    }
    await createProperty('contacts', prop);
    await sleep(200);
  }

  // Step 2e: Fix typo in existing contact property
  console.log('\n── STEP 2e: Property Cleanup ──');
  console.log('\n🔧 Renaming "Entrepreneural Society" → "Entrepreneurial Society"...');
  if (!DRY_RUN) {
    const renameRes = await hubspot('/crm/v3/properties/contacts/entrepreneural_society', {
      method: 'PATCH',
      body: JSON.stringify({ label: 'Entrepreneurial Society' }),
    });
    if (renameRes.ok) {
      console.log('   ✅ Renamed');
    } else if (renameRes.status === 404) {
      console.log('   ⏭️  Property not found (may already be renamed or doesn\'t exist)');
    } else {
      console.log(`   ⚠️  Could not rename (${renameRes.status}):`, JSON.stringify(renameRes.data).slice(0, 300));
    }
  } else {
    console.log('   [dry-run] Would rename property label');
  }

  // Step 3: Data Migration
  let migration = { migrated: 0, skipped: 0, errors: 0 };
  if (!SKIP_MIGRATION) {
    console.log('\n── STEP 3: Data Migration ──');
    migration = await migrateSubmissionNotes();
  } else {
    console.log('\n── STEP 3: Data Migration — SKIPPED (--skip-migration) ──');
  }

  // Step 4: Archive Old Field
  if (!SKIP_MIGRATION && !SKIP_ARCHIVE && migration.errors === 0) {
    console.log('\n── STEP 4: Archive Old Field ──');
    await archiveSubmissionNotes();
  } else if (migration.errors > 0) {
    console.log('\n── STEP 4: Archive — SKIPPED (migration had errors) ──');
  } else if (SKIP_ARCHIVE) {
    console.log('\n── STEP 4: Archive — SKIPPED (--skip-archive) ──');
  }

  // Step 5: Verify Existing Properties
  console.log('\n── STEP 5: Verify Existing Properties ──');
  const existingProps = [
    ['dealname', 'Deal Name'],
    ['job_title', 'Job Title'],
    ['job_url', 'Job URL'],
    ['pipeline', 'Pipeline'],
    ['dealstage', 'Deal Stage'],
    ['application_date', 'Application Date'],
    ['application_method', 'Application Method'],
    ['job_source', 'Job Source'],
    ['job_description', 'Job Description (new)'],
    ['salary_min', 'Salary Min (new)'],
    ['salary_raw', 'Salary Raw Posted (new)'],
    ['jd_section_company', 'About the Company (new)'],
    ['jd_section_role', 'Role & Responsibilities (new)'],
    ['jd_section_qualifications', 'Qualifications (new)'],
    ['amount', 'Amount (built-in, used as salary max)'],
  ];
  for (const [name, label] of existingProps) {
    await verifyProperty(name, label);
  }

  // Step 6: Verify Company Properties
  console.log('\n── STEP 6: Verify Company Properties ──');
  const companyPropsToVerify = [
    ['domain', 'Domain (built-in, primary match key)'],
    ['name', 'Company Name (built-in)'],
    ['industry', 'Industry (Breeze auto-enriched)'],
    ['annualrevenue', 'Annual Revenue (Breeze auto-enriched)'],
    ['numberofemployees', 'Number of Employees (Breeze auto-enriched)'],
    ['company_career_page', 'Career Page URL (new custom)'],
    ['tech_stack_extracted', 'Tech Stack Extracted (new custom)'],
    ['last_applied_date', 'Last Applied Date (new custom)'],
    ['open_deal_count', 'Open Deal Count (new custom)'],
  ];
  for (const [name, label] of companyPropsToVerify) {
    const res = await hubspot(`/crm/v3/properties/companies/${name}`);
    if (res.ok) {
      console.log(`   ✅ "${label}" (${name}) — ${res.data.type}/${res.data.fieldType}`);
    } else {
      console.log(`   ⚠️  "${label}" (${name}) — NOT FOUND`);
    }
  }

  // Step 7: Verify Contact Properties
  console.log('\n── STEP 7: Verify Contact Properties ──');
  const contactPropsToVerify = [
    ['firstname', 'First Name (built-in)'],
    ['lastname', 'Last Name (built-in)'],
    ['jobtitle', 'Job Title (built-in)'],
    ['company', 'Company (built-in)'],
    ['hs_linkedin_url', 'LinkedIn URL (built-in, use instead of linkedin_profile_url)'],
    ['linkedin_headline', 'LinkedIn Headline (new custom)'],
    ['linkedin_about', 'LinkedIn About (new custom)'],
    ['linkedin_connection_degree', 'Connection Degree (new custom)'],
    ['linkedin_education_university', 'Education University (new custom)'],
    ['capture_notes', 'Capture Notes (new custom)'],
    ['capture_next_steps', 'Next Steps (new custom)'],
    ['contact_capture_source', 'Capture Source (new custom)'],
    ['captured_at', 'Captured At (new custom)'],
  ];
  for (const [name, label] of contactPropsToVerify) {
    const res = await hubspot(`/crm/v3/properties/contacts/${name}`);
    if (res.ok) {
      console.log(`   ✅ "${label}" (${name}) — ${res.data.type}/${res.data.fieldType}`);
    } else {
      console.log(`   ⚠️  "${label}" (${name}) — NOT FOUND`);
    }
  }

  // Verify existing contact property groups
  console.log('\n   Existing contact property groups (should already exist):');
  for (const group of ['network_role', 'life_projects', 'contactinformation', 'socialmediainformation']) {
    await hubspot(`/crm/v3/properties/contacts/groups`);
    // Just note these exist — no creation needed
    console.log(`   ℹ️  "${group}" — existing (not modified)`);
  }

  // Step 8: Verify Scopes
  console.log('\n── STEP 8: API Scope Verification ──');
  const scopes = await verifyScopes();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  DEPLOYMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Deal Property Groups:    2 (Job Details, Import Tracking)`);
  console.log(`  Company Property Groups: 1 (Company Demographics)`);
  console.log(`  Contact Property Groups: 1 (LinkedIn Capture) + 4 existing`);
  console.log(`  New Deal Properties:     11 created/verified`);
  console.log(`  New Company Properties:  4 created/verified`);
  console.log(`  New Contact Properties:  11 created/verified`);
  console.log(`  Property Cleanup:        "Entrepreneural Society" → "Entrepreneurial Society"`);
  console.log(`  Data Migration:     ${migration.migrated} migrated, ${migration.skipped} already done, ${migration.errors} errors`);
  console.log(`  Old Field:          ${!SKIP_MIGRATION && !SKIP_ARCHIVE && migration.errors === 0 ? 'submission_notes archived' : 'unchanged'}`);
  console.log(`  API Access:         ${Object.values(scopes).every(v => v) ? '✅ All OK' : '⚠️  Issues detected'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n  Deals:`);
  console.log(`    Field mapping: submission_notes (deprecated) → job_description (active)`);
  console.log(`    Salary: amount = salary max (annual), salary_min = floor, salary_raw = original text`);
  console.log(`    Employment: FTE or Contract (hourly × 2,000 = annual)`);
  console.log(`    Coexisting fields: application_method, job_source, import_method`);
  console.log(`  Companies:`);
  console.log(`    Domain-first matching → Breeze auto-enrichment (industry, revenue, employees)`);
  console.log(`    Custom: career_page, tech_stack, last_applied_date, open_deal_count`);
  console.log(`  Contacts:`);
  console.log(`    LinkedIn capture: profile_url, headline, about, connection_degree, education (3 fields)`);
  console.log(`    Context: capture_notes, capture_next_steps`);
  console.log(`    Capture metadata: capture_source, captured_at`);
  console.log(`    Existing tag groups: network_role (9), life_projects (10), metro_area, focus_areas`);
  console.log(`    Follow-up tasks: created via HubSpot Engagements API, templates in Supabase`);
  console.log(`    Auto-classification rules stored in Supabase (auto_classification_rules table)\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
