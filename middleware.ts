import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/pricing',
    '/about',
    '/contact',
    '/sign-in',
    '/sign-up',
  ];

  // Public tipping paths
  const isPublicTippingPath = pathname.startsWith('/t/');

  // Check if path is public
  const isPublicPath =
    publicPaths.includes(pathname) ||
    isPublicTippingPath ||
    pathname.startsWith('/api/');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Protected paths require authentication
  // Only check if session cookie exists - don't validate in middleware
  // Full validation happens in the layout (Server Component with Node.js runtime)
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Let the request through - the layout will handle:
  // 1. Full session validation with database
  // 2. User type checking (staff vs company member)
  // 3. Proper redirection based on user type
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};