import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/players',
    '/rosters',
    '/trades',
    '/proposals',
    '/league-setup',
    '/settings'
  ];

  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for Supabase session cookie
    const supabaseToken = request.cookies.get('sb-access-token') || 
                         request.cookies.get('supabase-auth-token') ||
                         request.cookies.get('sb-localhost-auth-token');
    
    if (!supabaseToken) {
      // Redirect to login if no auth token found
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};