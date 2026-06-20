import { describe, it, expect } from 'vitest';
import { validateNextPath } from '../../apps/web/src/nav';

describe('validateNextPath', () => {
  it('returns the path when valid', () => {
    expect(validateNextPath('/animais')).toBe('/animais');
    expect(validateNextPath('/animais/pet-001/adotar')).toBe('/animais/pet-001/adotar');
    expect(validateNextPath('/abrigos/s-001/editar')).toBe('/abrigos/s-001/editar');
    expect(validateNextPath('/adocoes?foo=bar')).toBe('/adocoes?foo=bar');
  });

  it('returns null for null or undefined', () => {
    expect(validateNextPath(null)).toBeNull();
    expect(validateNextPath(undefined)).toBeNull();
    expect(validateNextPath('')).toBeNull();
  });

  it('rejects paths that do not start with /', () => {
    expect(validateNextPath('animais')).toBeNull();
    expect(validateNextPath('https://evil.com')).toBeNull();
  });

  it('rejects protocol-relative URLs (//)', () => {
    expect(validateNextPath('//evil.com')).toBeNull();
    expect(validateNextPath('//evil.com/animais')).toBeNull();
  });

  it('rejects paths starting with /http (open redirect via /http://)', () => {
    expect(validateNextPath('/http://evil.com')).toBeNull();
    expect(validateNextPath('/https://evil.com')).toBeNull();
  });

  it('rejects /entrar to prevent redirect loops', () => {
    expect(validateNextPath('/entrar')).toBeNull();
    expect(validateNextPath('/entrar?next=foo')).toBeNull();
  });
});
