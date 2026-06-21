import { describe, expect, it } from 'vitest';
import { webFoundationContent } from '../../apps/web/src/foundation';

const mojibakePatterns = ['Ã', 'Â', '�'];

describe('web foundation content', () => {
  it('uses clean PT-PT copy for the public foundation screen', () => {
    expect(webFoundationContent.locale).toBe('pt-PT');
    expect(webFoundationContent.hero.eyebrow).toBe('Plataforma de adopção animal');
    expect(webFoundationContent.hero.title).toBe('Pic4Paws');
    expect(webFoundationContent.hero.body).toContain('associações');
    expect(webFoundationContent.hero.body).toContain('adoções');
    expect(webFoundationContent.hero.body).toContain('donativos');

    const serialized = JSON.stringify(webFoundationContent);
    for (const pattern of mojibakePatterns) {
      expect(serialized).not.toContain(pattern);
    }
  });

  it('links primary action to the user registration page', () => {
    expect(webFoundationContent.primaryAction.href).toBe('/registar');
    expect(webFoundationContent.primaryAction.label).toBeTruthy();
  });

  it('surfaces the completed foundation contracts', () => {
    expect(webFoundationContent.readiness.map((item) => item.id)).toEqual([
      'database',
      'auth',
      'pets',
      'payments',
      'media',
      'workers',
    ]);
    expect(webFoundationContent.readiness.every((item) => item.status === 'contract-ready')).toBe(true);
  });
});
