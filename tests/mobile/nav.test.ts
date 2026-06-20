import { describe, it, expect } from 'vitest';
import { validateReturnTo } from '../../apps/mobile/src/nav';

describe('validateReturnTo', () => {
  it('returns null for undefined', () => {
    expect(validateReturnTo(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(validateReturnTo('')).toBeNull();
  });

  it('returns null for relative path', () => {
    expect(validateReturnTo('animais')).toBeNull();
  });

  it('returns null for external URL', () => {
    expect(validateReturnTo('https://evil.example.com')).toBeNull();
  });

  it('returns null for protocol-relative URL', () => {
    expect(validateReturnTo('//evil.example.com')).toBeNull();
  });

  it('returns null for /http prefix', () => {
    expect(validateReturnTo('/http://evil.example.com')).toBeNull();
  });

  it('returns null for /entrar to prevent auth loop', () => {
    expect(validateReturnTo('/entrar')).toBeNull();
  });

  it('returns null for /entrar with query string', () => {
    expect(validateReturnTo('/entrar?next=/animais')).toBeNull();
  });

  it('accepts valid internal path', () => {
    expect(validateReturnTo('/(app)/(tabs)/animais')).toBe('/(app)/(tabs)/animais');
  });

  it('accepts path with query string', () => {
    expect(validateReturnTo('/adocoes?status=approved')).toBe('/adocoes?status=approved');
  });

  it('uses first element when given an array', () => {
    expect(validateReturnTo(['/(app)/(tabs)/animais', '/other'])).toBe('/(app)/(tabs)/animais');
  });

  it('returns null for empty array', () => {
    expect(validateReturnTo([])).toBeNull();
  });
});
