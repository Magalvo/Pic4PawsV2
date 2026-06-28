import { describe, expect, it } from 'vitest';
import {
  assertNonDestructiveMigration,
  getSchemaColumnNames,
  migrationArtifacts,
  shelterPaymentConfigs,
} from '../../packages/database/src/index';
import type { ActivePaymentProvider } from '../../packages/domain/src/index';

describe('EUPAGO-DB-001: migration artifact', () => {
  it('migration 0008_eupago_provider exists in migrationArtifacts', () => {
    const m = migrationArtifacts.find((a) => a.id === '0008_eupago_provider');
    expect(m).toBeDefined();
  });

  it('migration 0008 passes assertNonDestructiveMigration', () => {
    const m = migrationArtifacts.find((a) => a.id === '0008_eupago_provider');
    expect(m).toBeDefined();
    if (!m) return;
    expect(() => assertNonDestructiveMigration(m)).not.toThrow();
  });

  it('migration 0008 creates shelter_active_provider enum', () => {
    const m = migrationArtifacts.find((a) => a.id === '0008_eupago_provider');
    expect(m?.sql).toContain('shelter_active_provider');
    expect(m?.sql).toContain("'ifthenpay'");
    expect(m?.sql).toContain("'eupago'");
  });

  it('migration 0008 adds all four new columns', () => {
    const m = migrationArtifacts.find((a) => a.id === '0008_eupago_provider');
    expect(m?.sql).toContain('active_provider');
    expect(m?.sql).toContain('eupago_api_key_encrypted');
    expect(m?.sql).toContain('eupago_webhook_secret_encrypted');
    expect(m?.sql).toContain('ifthenpay_anti_phishing_key');
  });
});

describe('EUPAGO-DB-001: Drizzle schema', () => {
  it('shelterPaymentConfigs has activeProvider column', () => {
    expect(getSchemaColumnNames(shelterPaymentConfigs)).toContain('activeProvider');
  });

  it('shelterPaymentConfigs has eupagoApiKeyEncrypted column', () => {
    expect(getSchemaColumnNames(shelterPaymentConfigs)).toContain('eupagoApiKeyEncrypted');
  });

  it('shelterPaymentConfigs has eupagoWebhookSecretEncrypted column', () => {
    expect(getSchemaColumnNames(shelterPaymentConfigs)).toContain('eupagoWebhookSecretEncrypted');
  });

  it('shelterPaymentConfigs has ifthenpayAntiPhishingKey column', () => {
    expect(getSchemaColumnNames(shelterPaymentConfigs)).toContain('ifthenpayAntiPhishingKey');
  });
});

describe('EUPAGO-DB-001: domain type', () => {
  it('ActivePaymentProvider type includes ifthenpay and eupago', () => {
    const ifthenpay: ActivePaymentProvider = 'ifthenpay';
    const eupago: ActivePaymentProvider = 'eupago';
    expect(ifthenpay).toBe('ifthenpay');
    expect(eupago).toBe('eupago');
  });
});
