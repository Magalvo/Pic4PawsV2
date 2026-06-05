import type { EnvironmentConfig } from '@pic4paws/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { WorkerRequestDependencies } from './dependencies';
import type { MediaUploadSigner } from './media-upload';

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
