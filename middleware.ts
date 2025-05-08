import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Get response
  const response = NextResponse.next();

  // Add CORS headers for API routes to ensure cookies are properly processed
  if (path.startsWith('/api/')) {
    // Add security headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', 'https://crush-confessions.vercel.app');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: [
    // Apply this middleware to all API routes
    '/api/:path*',
  ],
};