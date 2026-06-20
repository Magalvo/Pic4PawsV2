import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────

let _mockGetUser: () => Promise<{ data: { user: object | null }; error: null }>;

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: () => _mockGetUser() },
  }),
}));

// Synthetic NextResponse — no edge runtime required
vi.mock('next/server', () => {
  const makeResp = (init?: { status?: number; headers?: Record<string, string> }) => {
    const r = new Response(null, {
      status: init?.status ?? 200,
      headers: init?.headers,
    });
    Object.defineProperty(r, 'cookies', { value: { set: () => {} } });
    return r;
  };
  return {
    NextResponse: {
      next: () => makeResp(),
      redirect: (url: URL | string) =>
        makeResp({ status: 307, headers: { location: url.toString() } }),
    },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRequest = (pathname: string, search = ''): NextRequest => {
  const url = new URL(`https://app.test${pathname}${search}`);
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: { getAll: () => [], set: () => {} },
    headers: new Headers(),
  } as unknown as NextRequest;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('middleware — auth guard', () => {
  beforeEach(() => {
    _mockGetUser = async () => ({ data: { user: null }, error: null });
  });

  it('unauthenticated request to protected route redirects to /entrar?next=...', async () => {
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/entrar?next=');
    expect(location).toContain(encodeURIComponent('/dashboard'));
  });

  it('unauthenticated request to /animais passes through', async () => {
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/animais'));
    expect(res.status).not.toBe(307);
  });

  it('unauthenticated request to /animais/[petId] passes through', async () => {
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/animais/pet-001'));
    expect(res.status).not.toBe(307);
  });

  it('unauthenticated request to /abrigos passes through', async () => {
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/abrigos'));
    expect(res.status).not.toBe(307);
  });

  it('unauthenticated request to /abrigos/[shelterId] passes through', async () => {
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/abrigos/shelter-001'));
    expect(res.status).not.toBe(307);
  });

  it('authenticated user on /entrar redirects to /animais by default', async () => {
    _mockGetUser = async () => ({ data: { user: { id: 'u-1' } }, error: null });
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/entrar'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/animais');
  });

  it('authenticated /entrar?next=/adocoes redirects to validated destination', async () => {
    _mockGetUser = async () => ({ data: { user: { id: 'u-1' } }, error: null });
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/entrar', `?next=${encodeURIComponent('/adocoes')}`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/adocoes');
  });

  it('authenticated /entrar rejects open redirect to absolute URL — falls back to /animais', async () => {
    _mockGetUser = async () => ({ data: { user: { id: 'u-1' } }, error: null });
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/entrar', `?next=${encodeURIComponent('https://evil.com')}`));
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/animais');
    expect(location).not.toContain('evil.com');
  });

  it('authenticated user on protected route passes through', async () => {
    _mockGetUser = async () => ({ data: { user: { id: 'u-1' } }, error: null });
    const { middleware } = await import('../../apps/web/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).not.toBe(307);
  });
});
