import { describe, expect, it } from 'vitest';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';

const mojibakePatterns = ['Ã', 'Â', '�'];

describe('mobile foundation content', () => {
  it('uses clean PT-PT copy for the mobile foundation screen', () => {
    expect(mobileFoundationContent.locale).toBe('pt-PT');
    expect(mobileFoundationContent.hero.eyebrow).toBe('Fundação mobile Pic4Paws V2');
    expect(mobileFoundationContent.hero.title).toBe('Pic4Paws');
    expect(mobileFoundationContent.hero.body).toContain('associações');
    expect(mobileFoundationContent.hero.body).toContain('adoções');
    expect(mobileFoundationContent.hero.body).toContain('donativos');

    const serialized = JSON.stringify(mobileFoundationContent);
    for (const pattern of mojibakePatterns) {
      expect(serialized).not.toContain(pattern);
    }
  });

  it('does not expose navigation targets for unimplemented product flows', () => {
    expect(mobileFoundationContent.primaryAction.route).toBeNull();
    expect(mobileFoundationContent.primaryAction.label).toBe('Fundação técnica em curso');
    expect(JSON.stringify(mobileFoundationContent)).not.toContain('/adoption');
    expect(JSON.stringify(mobileFoundationContent)).not.toContain('/donations');
    expect(JSON.stringify(mobileFoundationContent)).not.toContain('/shelters');
  });

  it('surfaces the completed foundation contracts', () => {
    expect(mobileFoundationContent.readiness.map((item) => item.id)).toEqual([
      'database',
      'auth',
      'pets',
      'payments',
      'media',
      'workers',
    ]);
    expect(mobileFoundationContent.readiness.every((item) => item.status === 'contract-ready')).toBe(true);
  });
});
