import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { validateNextPath } from './src/nav';

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/entrar') return true;
  if (pathname === '/animais') return true;
  if (/^\/animais\/[^/]+$/.test(pathname)) return true;
  if (pathname === '/abrigos') return true;
  if (/^\/abrigos\/[^/]+$/.test(pathname)) return true;
  if (pathname === '/recuperar-palavra-passe') return true;
  if (pathname === '/recuperar-palavra-passe/confirmar') return true;
  if (pathname === '/registar') return true;
  if (pathname === '/termos') return true;
  if (pathname === '/privacidade') return true;
  return false;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicRoute(pathname)) {
    const next = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/entrar?next=${next}`, request.url));
  }

  if (user && pathname === '/entrar') {
    const nextParam = request.nextUrl.searchParams.get('next');
    const dest = validateNextPath(nextParam) ?? '/animais';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
