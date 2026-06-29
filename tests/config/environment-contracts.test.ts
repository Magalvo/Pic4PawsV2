import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, redactEnvironmentConfig } from '../../packages/config/src/index';

const validEnv = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

describe('parseEnvironmentConfig', () => {
  it('parses typed Supabase, R2, Worker and payment provider env', () => {
    expect(parseEnvironmentConfig(validEnv)).toEqual({
      ok: true,
      config: {
        app: {
          environment: 'production',
          publicAppOrigin: 'https://pic4paws.pt',
        },
        supabase: {
          url: 'https://example.supabase.co',
          anonKey: 'anon-key',
          serviceRoleKey: 'service-role-secret',
        },
        cloudflare: {
          accountId: 'cloudflare-account',
          r2PublicBucket: 'pic4paws-public',
          r2PrivateBucket: 'pic4paws-private',
          r2AccessKeyId: 'r2-access-key',
          r2SecretAccessKey: 'r2-secret-key',
        },
        workers: {
          paymentWebhookPath: '/webhooks/payments',
          mediaUploadPath: '/uploads/media',
          mediaUrlPath: '/media',
          petDraftsPath: '/pets/drafts',
          petFeedPath: '/pets',
          shelterPath: '/shelters',
          adoptionsPath: '/adoptions',
          donationsPath: '/donations',
          sponsorshipsPath: '/sponsorships',
          notificationsPath: '/notifications',
        },
        payments: {
          primaryProvider: 'eupago',
          webhooksEnabled: false,
          eupagoApiKey: 'eupago-api-key',
          eupagoWebhookSecret: 'eupago-webhook-secret',
          ifthenpayMbKey: null,
          ifthenpayMbWayKey: null,
          ifthenpayWebhookSecret: null,
          stripeSecretKey: null,
          stripeWebhookSecret: null,
          encryptionSecret: null,
        },
      },
    });
  });

  it('returns path-based errors without leaking secret values', () => {
    const result = parseEnvironmentConfig({
      ...validEnv,
      SUPABASE_URL: 'not-a-url',
      R2_SECRET_ACCESS_KEY: '',
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        { path: 'SUPABASE_URL', message: 'Invalid URL' },
        { path: 'R2_SECRET_ACCESS_KEY', message: 'Required' },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
  });

  it('requires provider-specific secrets for the primary provider', () => {
    expect(
      parseEnvironmentConfig({
        ...validEnv,
        PAYMENT_PRIMARY_PROVIDER: 'stripe',
        STRIPE_SECRET_KEY: '',
        STRIPE_WEBHOOK_SECRET: '',
      }),
    ).toEqual({
      ok: false,
      errors: [
        { path: 'STRIPE_SECRET_KEY', message: 'Required for primary provider stripe' },
        { path: 'STRIPE_WEBHOOK_SECRET', message: 'Required for primary provider stripe' },
      ],
    });
  });

  it('requires both IFTHENPAY_MB_KEY and IFTHENPAY_MBWAY_KEY for ifthenpay provider', () => {
    expect(
      parseEnvironmentConfig({
        ...validEnv,
        PAYMENT_PRIMARY_PROVIDER: 'ifthenpay',
        IFTHENPAY_WEBHOOK_SECRET: 'anti-phishing-key',
      }),
    ).toEqual({
      ok: false,
      errors: [
        { path: 'IFTHENPAY_MB_KEY', message: 'Required for primary provider ifthenpay' },
        { path: 'IFTHENPAY_MBWAY_KEY', message: 'Required for primary provider ifthenpay' },
      ],
    });
  });

  it('accepts a valid 64-char lowercase hex ENCRYPTION_SECRET', () => {
    const result = parseEnvironmentConfig({ ...validEnv, ENCRYPTION_SECRET: 'a'.repeat(64) });
    expect(result).toMatchObject({
      ok: true,
      config: { payments: { encryptionSecret: 'a'.repeat(64) } },
    });
  });

  it('rejects ENCRYPTION_SECRET shorter than 64 hex chars', () => {
    const result = parseEnvironmentConfig({ ...validEnv, ENCRYPTION_SECRET: 'a'.repeat(32) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === 'ENCRYPTION_SECRET')).toBe(true);
    }
  });

  it('rejects ENCRYPTION_SECRET with non-hex characters', () => {
    const result = parseEnvironmentConfig({ ...validEnv, ENCRYPTION_SECRET: 'g'.repeat(64) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === 'ENCRYPTION_SECRET')).toBe(true);
    }
  });

  it('rejects ENCRYPTION_SECRET with uppercase hex characters', () => {
    const result = parseEnvironmentConfig({ ...validEnv, ENCRYPTION_SECRET: 'A'.repeat(64) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === 'ENCRYPTION_SECRET')).toBe(true);
    }
  });

  it('absent ENCRYPTION_SECRET defaults to null', () => {
    const result = parseEnvironmentConfig(validEnv);
    expect(result).toMatchObject({ ok: true, config: { payments: { encryptionSecret: null } } });
  });

  it('parses the payment webhook processing feature flag explicitly', () => {
    expect(parseEnvironmentConfig({ ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' })).toMatchObject({
      ok: true,
      config: {
        payments: {
          primaryProvider: 'eupago',
          webhooksEnabled: true,
        },
      },
    });
  });
});

describe('redactEnvironmentConfig', () => {
  it('masks secrets while preserving non-secret operational values', () => {
    const parsed = parseEnvironmentConfig(validEnv);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(redactEnvironmentConfig(parsed.config)).toEqual({
      app: parsed.config.app,
      supabase: {
        url: 'https://example.supabase.co',
        anonKey: '[redacted]',
        serviceRoleKey: '[redacted]',
      },
      cloudflare: {
        accountId: 'cloudflare-account',
        r2PublicBucket: 'pic4paws-public',
        r2PrivateBucket: 'pic4paws-private',
        r2AccessKeyId: '[redacted]',
        r2SecretAccessKey: '[redacted]',
      },
      workers: parsed.config.workers,
      payments: {
        primaryProvider: 'eupago',
        webhooksEnabled: false,
        eupagoApiKey: '[redacted]',
        eupagoWebhookSecret: '[redacted]',
        ifthenpayMbKey: null,
        ifthenpayMbWayKey: null,
        ifthenpayWebhookSecret: null,
        stripeSecretKey: null,
        stripeWebhookSecret: null,
        encryptionSecret: null,
      },
    });
  });
});
