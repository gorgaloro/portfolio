export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  const hasUrl = !!process.env.SUPABASE_URL
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({ hasUrl, hasKey, runtime: 'nodejs' })
}
