import type { Session } from '@supabase/supabase-js';

export function validateReturnTo(returnTo: string | string[] | undefined): string | null {
  const path = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//')) return null;
  if (path.startsWith('/http')) return null;
  if (path.startsWith('/entrar')) return null;
  return path;
}

export function isPublicRoute(segments: string[]): boolean {
  if (segments[0] === '(auth)') return true;
  // animais tab root — (app)/(tabs)/animais
  if (segments[0] === '(app)' && segments[1] === '(tabs)' && segments[2] === 'animais' && !segments[3]) return true;
  // animais/[petId] public detail
  if (segments[0] === 'animais' && segments[1] && !segments[2]) return true;
  // abrigos tab root — (app)/(tabs)/abrigos (matches web middleware)
  if (segments[0] === '(app)' && segments[1] === '(tabs)' && segments[2] === 'abrigos' && !segments[3]) return true;
  // abrigos/[shelterId] public detail (matches web middleware)
  if (segments[0] === 'abrigos' && segments[1] && !segments[2]) return true;
  return false;
}

export type AuthRedirect = { action: 'replace'; href: string };

export function computeAuthRedirect({
  session,
  segments,
  pathname,
}: {
  session: Session | null | undefined;
  segments: string[];
  pathname: string;
}): AuthRedirect | null {
  if (session === undefined) return null;

  const inAuthGroup = segments[0] === '(auth)';
  const publicRoute = isPublicRoute(segments);

  if (!session && !publicRoute) {
    return { action: 'replace', href: `/(auth)/entrar?returnTo=${encodeURIComponent(pathname)}` };
  }

  if (session && inAuthGroup) {
    return { action: 'replace', href: '/(app)/(tabs)/animais' };
  }

  return null;
}
