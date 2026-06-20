import { describe, it, expect } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { isPublicRoute, computeAuthRedirect } from '../../apps/mobile/src/nav';

const SESSION = { user: { id: 'u-1' } } as Session;

describe('isPublicRoute', () => {
  it('returns true for (auth) group root', () => {
    expect(isPublicRoute(['(auth)'])).toBe(true);
  });

  it('returns true for (auth)/entrar', () => {
    expect(isPublicRoute(['(auth)', 'entrar'])).toBe(true);
  });

  it('returns true for animais tab root in (app)/(tabs)', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'animais'])).toBe(true);
  });

  it('returns false for animais tab with a child segment (detail sub-route via tabs)', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'animais', 'pet-123'])).toBe(false);
  });

  it('returns true for animais/[petId] public detail', () => {
    expect(isPublicRoute(['animais', 'pet-123'])).toBe(true);
  });

  it('returns false for animais/[petId]/sub-path', () => {
    expect(isPublicRoute(['animais', 'pet-123', 'sub'])).toBe(false);
  });

  it('returns false for adocoes tab', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'adocoes'])).toBe(false);
  });

  it('returns false for notificacoes tab', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'notificacoes'])).toBe(false);
  });

  it('returns false for patrocinios tab', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'patrocinios'])).toBe(false);
  });

  it('returns true for abrigos tab root in (app)/(tabs)', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'abrigos'])).toBe(true);
  });

  it('returns false for abrigos tab with a child segment', () => {
    expect(isPublicRoute(['(app)', '(tabs)', 'abrigos', 'shelter-123'])).toBe(false);
  });

  it('returns true for abrigos/[shelterId] public detail', () => {
    expect(isPublicRoute(['abrigos', 'shelter-abc'])).toBe(true);
  });

  it('returns false for abrigos/[shelterId]/sub-path (candidaturas, animais, etc. require auth)', () => {
    expect(isPublicRoute(['abrigos', 'shelter-abc', 'candidaturas'])).toBe(false);
  });

  it('returns false for empty segments', () => {
    expect(isPublicRoute([])).toBe(false);
  });
});

describe('computeAuthRedirect', () => {
  it('returns null when session is undefined (still loading)', () => {
    const result = computeAuthRedirect({
      session: undefined,
      segments: ['(app)', '(tabs)', 'adocoes'],
      pathname: '/(app)/(tabs)/adocoes',
    });
    expect(result).toBeNull();
  });

  it('redirects unauthenticated user on a protected route to entrar with encoded returnTo', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(app)', '(tabs)', 'adocoes'],
      pathname: '/(app)/(tabs)/adocoes',
    });
    expect(result).toEqual({
      action: 'replace',
      href: '/(auth)/entrar?returnTo=%2F(app)%2F(tabs)%2Fadocoes',
    });
  });

  it('encodes special characters in the returnTo path', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(app)', '(tabs)', 'patrocinios'],
      pathname: '/(app)/(tabs)/patrocinios',
    });
    expect(result?.href).toContain('returnTo=');
    expect(result?.href).toContain(encodeURIComponent('/(app)/(tabs)/patrocinios'));
  });

  it('does not redirect unauthenticated user on (auth) group routes', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(auth)', 'entrar'],
      pathname: '/(auth)/entrar',
    });
    expect(result).toBeNull();
  });

  it('does not redirect unauthenticated user on animais tab root', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(app)', '(tabs)', 'animais'],
      pathname: '/(app)/(tabs)/animais',
    });
    expect(result).toBeNull();
  });

  it('does not redirect unauthenticated user on animais/[petId] public detail', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['animais', 'pet-abc'],
      pathname: '/animais/pet-abc',
    });
    expect(result).toBeNull();
  });

  it('does not redirect unauthenticated user on abrigos tab root', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(app)', '(tabs)', 'abrigos'],
      pathname: '/(app)/(tabs)/abrigos',
    });
    expect(result).toBeNull();
  });

  it('does not redirect unauthenticated user on abrigos/[shelterId] public detail', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['abrigos', 'shelter-abc'],
      pathname: '/abrigos/shelter-abc',
    });
    expect(result).toBeNull();
  });

  it('redirects unauthenticated user on abrigos sub-path to entrar', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['abrigos', 'shelter-abc', 'candidaturas'],
      pathname: '/abrigos/shelter-abc/candidaturas',
    });
    expect(result).toEqual({
      action: 'replace',
      href: '/(auth)/entrar?returnTo=%2Fabrigos%2Fshelter-abc%2Fcandidaturas',
    });
  });

  it('redirects authenticated user in (auth) group to animais home', () => {
    const result = computeAuthRedirect({
      session: SESSION,
      segments: ['(auth)', 'entrar'],
      pathname: '/(auth)/entrar',
    });
    expect(result).toEqual({ action: 'replace', href: '/(app)/(tabs)/animais' });
  });

  it('does not redirect authenticated user on a protected tab route', () => {
    const result = computeAuthRedirect({
      session: SESSION,
      segments: ['(app)', '(tabs)', 'adocoes'],
      pathname: '/(app)/(tabs)/adocoes',
    });
    expect(result).toBeNull();
  });

  it('does not redirect authenticated user on animais tab', () => {
    const result = computeAuthRedirect({
      session: SESSION,
      segments: ['(app)', '(tabs)', 'animais'],
      pathname: '/(app)/(tabs)/animais',
    });
    expect(result).toBeNull();
  });

  it('does not redirect authenticated user on animais pet detail', () => {
    const result = computeAuthRedirect({
      session: SESSION,
      segments: ['animais', 'pet-abc'],
      pathname: '/animais/pet-abc',
    });
    expect(result).toBeNull();
  });

  it('redirect action is always replace', () => {
    const result = computeAuthRedirect({
      session: null,
      segments: ['(app)', '(tabs)', 'notificacoes'],
      pathname: '/(app)/(tabs)/notificacoes',
    });
    expect(result?.action).toBe('replace');
  });
});
