import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const area = request.cookies.get('user_area')?.value;
  
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Si no hay token y no está en login, redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay token y está en login, redirigir al dashboard correspondiente
  if (token && isLoginPage) {
    if (area === 'Despacho') {
      return NextResponse.redirect(new URL('/despacho', request.url));
    }
    return NextResponse.redirect(new URL('/almacen', request.url));
  }

  // Lógica de Áreas (RBAC Básica)
  if (token && area) {
    if (area === 'Almacen' && request.nextUrl.pathname.startsWith('/despacho')) {
      return NextResponse.redirect(new URL('/almacen', request.url));
    }
    if (area === 'Despacho' && request.nextUrl.pathname.startsWith('/almacen')) {
      return NextResponse.redirect(new URL('/despacho', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
