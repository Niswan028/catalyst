// Middleware for enforcing authentication on protected application routes
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/medications',
  '/appointments',
  '/messages',
  '/checkin',
  '/caregiver',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    // Check for Supabase session cookies
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        c.name.includes('sb-') ||
        c.name.includes('auth-token') ||
        c.name.includes('supabase-auth')
    );

    // Also check Authorization header for API calls
    const authHeader = request.headers.get('authorization');
    const hasAuthHeader = Boolean(authHeader && authHeader.startsWith('Bearer '));

    if (!hasAuthCookie && !hasAuthHeader) {
      // Redirect unauthenticated web user to signin
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (manifest.json, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
