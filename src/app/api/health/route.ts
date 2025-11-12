export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || null
  const branch = process.env.VERCEL_GIT_COMMIT_REF || null
  return NextResponse.json({
    ok: true,
    commit: { sha, message, branch },
    routes: {
      enrichJobs: '/api/admin/enrich-jobs',
      enrichOneDebug: '/api/admin/enrich-one-debug',
      referralAttributes: '/api/admin/referral-attributes'
    },
    debug: {
      alwaysIncludeDebug: true,
      urlParamDebug: true
    },
    deployedAt: new Date().toISOString()
  })
}
