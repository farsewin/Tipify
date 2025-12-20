import { NextResponse, type NextRequest } from 'next/server';
import { AuthenticationService } from '@/src/services/authentication.service';
import { SESSION_COOKIE } from '@/config';

const authenticationService = new AuthenticationService();

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
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  try {
    // Use AuthenticationService directly
    await authenticationService.validateSession(sessionId);
  } catch (err) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
