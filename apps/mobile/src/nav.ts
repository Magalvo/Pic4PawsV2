export function validateReturnTo(returnTo: string | string[] | undefined): string | null {
  const path = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//')) return null;
  if (path.startsWith('/http')) return null;
  if (path.startsWith('/entrar')) return null;
  return path;
}
