import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_session'

function getSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET || process.env.SERVICE_ROLE_KEY || 'insecure-dev-secret'
}

async function sha256(text: string) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
  const bytes = Array.from(new Uint8Array(buf))
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [iat, sig] = token.split('.')
  if (!iat || !sig) return false
  const expected = await sha256(`${getSecret()}|${iat}`)
  return sig === expected
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  const isAdminUI = pathname.startsWith('/admin')
  const isAdminSignIn = pathname.startsWith('/admin/signin')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isLoginApi = pathname.startsWith('/api/admin/login')

  if (!(isAdminUI || isAdminApi)) return NextResponse.next()

  if (isLoginApi || isAdminSignIn) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const ok = await verifyToken(token)

  if (ok) return NextResponse.next()

  if (isAdminApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/admin/signin'
  url.search = search ? `?next=${encodeURIComponent(pathname + search)}` : `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
