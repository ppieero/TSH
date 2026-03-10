import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['es', 'en', 'pt']
const DEFAULT_LOCALE = 'es'
const PROTECTED_PATHS = ['/dashboard', '/terapeuta']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Check if the path already has a locale prefix
  const hasLocale = LOCALES.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  )

  if (!hasLocale) {
    // Redirect to the default locale
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`
    return NextResponse.redirect(url)
  }

  // Auth protection for dashboard/terapeuta
  const locale = LOCALES.find((l) => pathname.startsWith(`/${l}`)) || DEFAULT_LOCALE
  const isProtected = PROTECTED_PATHS.some((p) => pathname.includes(p))

  if (isProtected) {
    // Check for Supabase auth cookie
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0]

    const authCookie =
      request.cookies.get('sb-access-token') ||
      (projectRef
        ? request.cookies.get(`sb-${projectRef}-auth-token`)
        : undefined)

    if (!authCookie) {
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/auth/login`
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
