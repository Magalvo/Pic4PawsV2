export function validateNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.startsWith('/http')) return null;
  if (next.startsWith('/entrar')) return null;
  return next;
}
