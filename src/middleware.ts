import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/authEdge';

export async function middleware(request: NextRequest) {
  const protectedRoutes = ['/add-school'];
  const authRoutes = ['/login', '/signup'];
  
  const { pathname } = request.nextUrl;

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await verifyTokenEdge(token);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('auth-token', '', { maxAge: 0 });
      return response;
    }
  }

  if (authRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      try {
        await verifyTokenEdge(token);
        return NextResponse.redirect(new URL('/schools', request.url));
      } catch {
        const response = NextResponse.next();
        response.cookies.set('auth-token', '', { maxAge: 0 });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/add-school/:path*', '/login', '/signup']
};
