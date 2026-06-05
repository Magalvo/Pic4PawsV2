import { describe, expect, it } from 'vitest';
import {
  assertSafeR2DryRunCommand,
  createR2BucketContract,
  createR2UploadDryRun,
  parseEnvironmentConfig,
  r2DryRunPlan,
  renderR2DryRunGuide,
  type EnvironmentConfig,
} from '../../packages/config/src/index';
import { createMediaUploadContract, type MediaUploadContract } from '../../packages/domain/src/index';

const secretPattern = /(CLOUDFLARE_API_TOKEN|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|secret-access-key|access-key-id|eyJ[a-zA-Z0-9_-]+)/i;

const validEnv = {
  APP_ENV: 'development',
  PUBLIC_APP_ORIGIN: 'http://localhost:3000',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'local-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'local-service-role-key',
  CLOUDFLARE_ACCOUNT_ID: 'local-cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public-dev',
  R2_PRIVATE_BUCKET: 'pic4paws-private-dev',
  R2_ACCESS_KEY_ID: 'access-key-id',
  R2_SECRET_ACCESS_KEY: 'secret-access-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const parseValidConfig = (): EnvironmentConfig => {
  const parsed = parseEnvironmentConfig(validEnv);

  expect(parsed.ok).toBe(true);
  if (!parsed.ok) {
    throw new Error('Expected valid config');
  }

  return parsed.config;
};

const createValidMediaContract = (): MediaUploadContract => {
  const result = createMediaUploadContract({
    request: {
      id: 'media-1',
      purpose: 'pet_public_image',
      requestedVisibility: 'public',
      mimeType: 'image/jpeg',
      byteSize: 1_200_000,
      ownerUserId: 'user-a',
      shelterId: 'shelter-a',
      originalFilename: 'becas.jpg',
    },
    now: '2026-06-04T12:30:00.000Z',
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected valid media contract');
  }

  return result.contract;
};

describe('R2 bucket contracts', () => {
  it('maps public and private media to distinct R2 buckets without exposing secrets', () => {
    const bucketContract = createR2BucketContract(parseValidConfig());

    expect(bucketContract.publicBucket.name).toBe('pic4paws-public-dev');
    expect(bucketContract.publicBucket.visibility).toBe('public');
    expect(bucketContract.privateBucket.name).toBe('pic4paws-private-dev');
    expect(bucketContract.privateBucket.visibility).toBe('private');
    expect(JSON.stringify(bucketContract)).not.toMatch(secretPattern);
  });

  it('rejects identical public and private bucket names', () => {
    const config = parseValidConfig();

    expect(() =>
      createR2BucketContract({
        ...config,
        cloudflare: {
          ...config.cloudflare,
          r2PrivateBucket: config.cloudflare.r2PublicBucket,
        },
      }),
    ).toThrow('R2 public and private buckets must be distinct');
  });

  it('creates dry-run upload metadata without signed URLs', () => {
    const mediaContract = createValidMediaContract();
    const uploadDryRun = createR2UploadDryRun({
      buckets: createR2BucketContract(parseValidConfig()),
      media: mediaContract,
    });

    expect(uploadDryRun).toEqual({
      bucketName: 'pic4paws-public-dev',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
      contentType: 'image/jpeg',
      byteSize: 1_200_000,
      visibility: 'public',
      signedUrl: null,
      dryRunOnly: true,
    });
  });
});

describe('R2 dry-run guidance', () => {
  it('documents only local/review dry-run steps', () => {
    expect(r2DryRunPlan.target).toBe('local-review');
    expect(r2DryRunPlan.generatesSignedUrls).toBe(false);

    for (const step of r2DryRunPlan.steps) {
      expect(() => assertSafeR2DryRunCommand(step.command)).not.toThrow();
      expect(step.command).not.toMatch(/wrangler\s+r2\s+object\s+put|wrangler\s+r2\s+bucket\s+delete|wrangler\s+secret\s+put|--remote|CLOUDFLARE_API_TOKEN/i);
    }
  });

  it('rejects production-risk Cloudflare commands', () => {
    expect(() => assertSafeR2DryRunCommand('wrangler r2 object put pic4paws-public/key')).toThrow(
      'Production-risk Cloudflare R2 command is not allowed in dry-run guidance',
    );
    expect(() => assertSafeR2DryRunCommand('wrangler secret put R2_SECRET_ACCESS_KEY')).toThrow(
      'Production-risk Cloudflare R2 command is not allowed in dry-run guidance',
    );
    expect(() => assertSafeR2DryRunCommand('wrangler r2 bucket list --remote')).toThrow(
      'Production-risk Cloudflare R2 command is not allowed in dry-run guidance',
    );
  });

  it('renders guidance without secrets or credential placeholders', () => {
    const guide = renderR2DryRunGuide();

    expect(guide).toContain('docs/infra/r2-local-dry-run.md');
    expect(guide).toContain('packages/domain/src/media-policy.ts');
    expect(guide).toContain('No signed upload URLs are generated');
    expect(guide).not.toMatch(secretPattern);
  });
});
