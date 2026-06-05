import type { EnvironmentConfig } from './env';

export type R2BucketVisibility = 'public' | 'private';

export type R2BucketDefinition = {
  name: string;
  visibility: R2BucketVisibility;
  purpose: string;
};

export type R2BucketContract = {
  accountId: string;
  publicBucket: R2BucketDefinition;
  privateBucket: R2BucketDefinition;
};

export type R2MediaUploadInput = {
  objectKey: string;
  visibility: R2BucketVisibility;
  mimeType: string;
  byteSize: number;
};

export type R2UploadDryRunInput = {
  buckets: R2BucketContract;
  media: R2MediaUploadInput;
};

export type R2UploadDryRun = {
  bucketName: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  visibility: R2BucketVisibility;
  signedUrl: null;
  dryRunOnly: true;
};

export type R2DryRunStep = {
  label: string;
  command: string;
  scope: 'review' | 'test';
};

export type R2DryRunPlan = {
  target: 'local-review';
  generatesSignedUrls: false;
  steps: R2DryRunStep[];
};

const productionRiskCommandPattern =
  /\bwrangler\s+r2\s+object\s+(put|delete)\b|\bwrangler\s+r2\s+bucket\s+(delete|create)\b|\bwrangler\s+secret\s+put\b|--remote|CLOUDFLARE_API_TOKEN|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/i;

export const createR2BucketContract = (config: EnvironmentConfig): R2BucketContract => {
  const publicBucketName = config.cloudflare.r2PublicBucket.trim();
  const privateBucketName = config.cloudflare.r2PrivateBucket.trim();

  if (publicBucketName === privateBucketName) {
    throw new Error('R2 public and private buckets must be distinct');
  }

  return {
    accountId: config.cloudflare.accountId,
    publicBucket: {
      name: publicBucketName,
      visibility: 'public',
      purpose: 'Public pet and shelter image derivatives.',
    },
    privateBucket: {
      name: privateBucketName,
      visibility: 'private',
      purpose: 'Private adoption, identity and medical documents.',
    },
  };
};

export const createR2UploadDryRun = ({
  buckets,
  media,
}: R2UploadDryRunInput): R2UploadDryRun => ({
  bucketName:
    media.visibility === 'public' ? buckets.publicBucket.name : buckets.privateBucket.name,
  objectKey: media.objectKey,
  contentType: media.mimeType,
  byteSize: media.byteSize,
  visibility: media.visibility,
  signedUrl: null,
  dryRunOnly: true,
});

export const assertSafeR2DryRunCommand = (command: string): void => {
  if (productionRiskCommandPattern.test(command)) {
    throw new Error('Production-risk Cloudflare R2 command is not allowed in dry-run guidance');
  }
};

export const r2DryRunPlan: R2DryRunPlan = {
  target: 'local-review',
  generatesSignedUrls: false,
  steps: [
    {
      label: 'Review media upload policy',
      command: 'review packages/domain/src/media-policy.ts',
      scope: 'review',
    },
    {
      label: 'Review R2 bucket contract',
      command: 'review packages/config/src/r2.ts',
      scope: 'review',
    },
    {
      label: 'Validate R2 dry-run contract tests',
      command: 'npm run test',
      scope: 'test',
    },
  ],
};

for (const step of r2DryRunPlan.steps) {
  assertSafeR2DryRunCommand(step.command);
}

export const renderR2DryRunGuide = (): string => {
  const steps = r2DryRunPlan.steps
    .map((step, index) => `${index + 1}. ${step.label}: \`${step.command}\``)
    .join('\n');

  return [
    '# R2 Local Dry Run',
    '',
    'Guide: `docs/infra/r2-local-dry-run.md`',
    'Policy: `packages/domain/src/media-policy.ts`',
    'Contract: `packages/config/src/r2.ts`',
    'No signed upload URLs are generated during this phase.',
    '',
    steps,
  ].join('\n');
};
