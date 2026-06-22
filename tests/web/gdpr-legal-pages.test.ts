import { describe, expect, it } from 'vitest';
import { termosContent, privacidadeContent } from '../../apps/web/src/gdpr-legal';

const mojibakePatterns = ['Ã', 'Â', '�'];

function assertNoMojibake(text: string) {
  for (const pattern of mojibakePatterns) {
    expect(text).not.toContain(pattern);
  }
}

describe('termosContent', () => {
  it('has pt-PT locale', () => {
    expect(termosContent.locale).toBe('pt-PT');
  });

  it('has a non-empty title', () => {
    expect(termosContent.title).toBeTruthy();
  });

  it('has a lastUpdated date string', () => {
    expect(termosContent.lastUpdated).toBeTruthy();
  });

  it('has sections for service identification', () => {
    const headings = termosContent.sections.map((s) => s.heading.toLowerCase());
    const hasIdentification = headings.some(
      (h) => h.includes('serviço') || h.includes('identificação') || h.includes('plataforma'),
    );
    expect(hasIdentification).toBe(true);
  });

  it('has sections covering user obligations', () => {
    const headings = termosContent.sections.map((s) => s.heading.toLowerCase());
    const hasObligations = headings.some(
      (h) => h.includes('obrigações') || h.includes('utilizador') || h.includes('condições'),
    );
    expect(hasObligations).toBe(true);
  });

  it('has sections covering data protection', () => {
    const headings = termosContent.sections.map((s) => s.heading.toLowerCase());
    const hasDataProtection = headings.some(
      (h) => h.includes('dados') || h.includes('privacidade') || h.includes('proteção'),
    );
    expect(hasDataProtection).toBe(true);
  });

  it('has sections covering governing law', () => {
    const headings = termosContent.sections.map((s) => s.heading.toLowerCase());
    const hasGoverningLaw = headings.some(
      (h) => h.includes('lei') || h.includes('jurisdição') || h.includes('aplicável'),
    );
    expect(hasGoverningLaw).toBe(true);
  });

  it('contains no mojibake in any section', () => {
    const serialized = JSON.stringify(termosContent);
    assertNoMojibake(serialized);
  });

  it('has at least four sections', () => {
    expect(termosContent.sections.length).toBeGreaterThanOrEqual(4);
  });
});

describe('privacidadeContent', () => {
  it('has pt-PT locale', () => {
    expect(privacidadeContent.locale).toBe('pt-PT');
  });

  it('has a non-empty title', () => {
    expect(privacidadeContent.title).toBeTruthy();
  });

  it('has a lastUpdated date string', () => {
    expect(privacidadeContent.lastUpdated).toBeTruthy();
  });

  it('has sections identifying the data controller', () => {
    const headings = privacidadeContent.sections.map((s) => s.heading.toLowerCase());
    const hasController = headings.some(
      (h) =>
        h.includes('responsável') || h.includes('controlador') || h.includes('tratamento'),
    );
    expect(hasController).toBe(true);
  });

  it('has sections covering data collected', () => {
    const headings = privacidadeContent.sections.map((s) => s.heading.toLowerCase());
    const hasDataCollected = headings.some(
      (h) => h.includes('recolhidos') || h.includes('recolha') || h.includes('dados pessoais'),
    );
    expect(hasDataCollected).toBe(true);
  });

  it('has sections covering legal basis (GDPR Art. 6)', () => {
    const serialized = JSON.stringify(privacidadeContent).toLowerCase();
    const hasBasis =
      serialized.includes('base jurídica') ||
      serialized.includes('jurídica') ||
      serialized.includes('consentimento') ||
      serialized.includes('legítimo');
    expect(hasBasis).toBe(true);
  });

  it('has sections covering data retention', () => {
    const headings = privacidadeContent.sections.map((s) => s.heading.toLowerCase());
    const hasRetention = headings.some(
      (h) => h.includes('conservação') || h.includes('retenção') || h.includes('prazo'),
    );
    expect(hasRetention).toBe(true);
  });

  it('has sections covering data subject rights', () => {
    const serialized = JSON.stringify(privacidadeContent).toLowerCase();
    const hasRights =
      serialized.includes('direitos') || serialized.includes('acesso') || serialized.includes('portabilidade');
    expect(hasRights).toBe(true);
  });

  it('contains no mojibake in any section', () => {
    const serialized = JSON.stringify(privacidadeContent);
    assertNoMojibake(serialized);
  });

  it('has at least five sections', () => {
    expect(privacidadeContent.sections.length).toBeGreaterThanOrEqual(5);
  });
});
