import type { EnvironmentConfig } from '@pic4paws/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { WorkerRequestDependencies } from './dependencies';
import type { MediaUploadSigner } from './media-upload';
import type { MediaDownloadSigner } from './media-url';

export type R2UploadPresignerInput = {
  endpoint: string;
  region: 'auto';
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  expiresInSeconds: number;
};

export type R2UploadPresignerResult = {
  signedUrl: string;
};

export type R2UploadPresigner = (
  input: R2UploadPresignerInput,
) => Promise<R2UploadPresignerResult>;

export type CreateR2UploadSignerInput = {
  config: EnvironmentConfig;
  presignUpload?: R2UploadPresigner;
  now?: () => Date;
  maxExpiresInSeconds?: number;
};

export class R2UploadSignerFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'R2UploadSignerFactoryError';
  }
}

const r2Region = 'auto';
const defaultMaxExpiresInSeconds = 900;
const signerFailureMessage = 'Failed to create R2 upload signature';

const createR2Endpoint = (accountId: string): string =>
  `https://${accountId}.r2.cloudflarestorage.com`;

const normalizeExpiresInSeconds = (
  expiresInSeconds: number,
  maxExpiresInSeconds: number,
): number => {
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new R2UploadSignerFactoryError(signerFailureMessage);
  }

  return Math.min(expiresInSeconds, maxExpiresInSeconds);
};

const defaultPresignUpload: R2UploadPresigner = async ({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
  bucketName,
  objectKey,
  contentType,
  byteSize,
  expiresInSeconds,
}) => {
  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: byteSize,
  });

  return {
    signedUrl: await getSignedUrl(client, command, { expiresIn: expiresInSeconds }),
  };
};

export const createR2UploadSigner = ({
  config,
  presignUpload = defaultPresignUpload,
  now = () => new Date(),
  maxExpiresInSeconds = defaultMaxExpiresInSeconds,
}: CreateR2UploadSignerInput): MediaUploadSigner => {
  const endpoint = createR2Endpoint(config.cloudflare.accountId);

  return async ({
    bucketName,
    objectKey,
    contentType,
    byteSize,
    expiresInSeconds,
  }) => {
    const boundedExpiresInSeconds = normalizeExpiresInSeconds(
      expiresInSeconds,
      maxExpiresInSeconds,
    );
    const expiresAt = new Date(now().getTime() + boundedExpiresInSeconds * 1000).toISOString();

    try {
      const signedUpload = await presignUpload({
        endpoint,
        region: r2Region,
        accessKeyId: config.cloudflare.r2AccessKeyId,
        secretAccessKey: config.cloudflare.r2SecretAccessKey,
        bucketName,
        objectKey,
        contentType,
        byteSize,
        expiresInSeconds: boundedExpiresInSeconds,
      });

      if (signedUpload.signedUrl.trim().length === 0) {
        throw new Error('empty signed URL');
      }

      return {
        signedUrl: signedUpload.signedUrl,
        expiresAt,
      };
    } catch {
      throw new R2UploadSignerFactoryError(signerFailureMessage);
    }
  };
};

export const createR2UploadSignerWorkerDependencies = (
  input: CreateR2UploadSignerInput,
): WorkerRequestDependencies => ({
  mediaUploadSigner: createR2UploadSigner(input),
});

// ─── R2 Download Signer ───────────────────────────────────────────────────────

export type R2DownloadPresignerInput = {
  endpoint: string;
  region: 'auto';
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  objectKey: string;
  expiresInSeconds: number;
};

export type R2DownloadPresigner = (
  input: R2DownloadPresignerInput,
) => Promise<{ signedUrl: string }>;

export type CreateR2DownloadSignerInput = {
  config: EnvironmentConfig;
  presignDownload?: R2DownloadPresigner;
  now?: () => Date;
  maxExpiresInSeconds?: number;
};

const defaultPresignDownload: R2DownloadPresigner = async ({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
  bucketName,
  objectKey,
  expiresInSeconds,
}) => {
  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
  return { signedUrl: await getSignedUrl(client, command, { expiresIn: expiresInSeconds }) };
};

export const createR2DownloadSigner = ({
  config,
  presignDownload = defaultPresignDownload,
  now = () => new Date(),
  maxExpiresInSeconds = defaultMaxExpiresInSeconds,
}: CreateR2DownloadSignerInput): MediaDownloadSigner => {
  const endpoint = createR2Endpoint(config.cloudflare.accountId);

  return async ({ bucketName, objectKey, expiresInSeconds }) => {
    const bounded = normalizeExpiresInSeconds(expiresInSeconds, maxExpiresInSeconds);
    const expiresAt = new Date(now().getTime() + bounded * 1000).toISOString();

    try {
      const result = await presignDownload({
        endpoint,
        region: r2Region,
        accessKeyId: config.cloudflare.r2AccessKeyId,
        secretAccessKey: config.cloudflare.r2SecretAccessKey,
        bucketName,
        objectKey,
        expiresInSeconds: bounded,
      });

      if (result.signedUrl.trim().length === 0) throw new Error('empty signed URL');

      return { url: result.signedUrl, expiresAt };
    } catch {
      throw new R2UploadSignerFactoryError(signerFailureMessage);
    }
  };
};

export const createR2DownloadSignerWorkerDependencies = (
  input: CreateR2DownloadSignerInput,
): WorkerRequestDependencies => ({
  mediaDownloadSigner: createR2DownloadSigner(input),
});
