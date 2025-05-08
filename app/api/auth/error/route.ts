import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom API route to handle NextAuth error redirects
 * This ensures that errors are properly handled and displayed to the user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  console.log('Auth error received:', error);
  
  // Redirect to our custom error page with the error parameter
  return NextResponse.redirect(new URL(`/auth/error?error=${error || 'Unknown'}`, request.url));
}
