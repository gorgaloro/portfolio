export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

const COOKIE_NAME = 'admin_session'

function getSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET || process.env.SERVICE_ROLE_KEY || 'insecure-dev-secret'
}

function sha256(text: string) {
  return createHash('sha256').update(text).digest('hex')
}

async function makeToken(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const sig = sha256(`${getSecret()}|${iat}`)
  return `${iat}.${sig}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: string, password?: string }
    const pw = (body.password || '').toString()
    const envPw = process.env.ADMIN_PASSWORD || ''

    if (!envPw) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    if (!pw || pw !== envPw) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = await makeToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
