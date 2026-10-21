import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gate every /admin route behind a staff session, and keep the admin out of
 * search indexes. Signature verification itself lives in lib/admin/session
 * (Node crypto); middleware only checks a cookie is present and lets the
 * page-level guard do the cryptographic check — belt and braces, since the
 * Edge runtime has no node:crypto.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!request.cookies.get('oriel_staff')?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
