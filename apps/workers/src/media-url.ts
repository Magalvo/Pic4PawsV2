import type { EnvironmentConfig } from '@pic4paws/config';

// ─── Repository types ─────────────────────────────────────────────────────────

export type MediaAssetReadRow = {
  objectKey: string;
  visibility: 'public' | 'private';
};

export type MediaAssetReadRepository = {
  getMediaAsset: (mediaId: string) => Promise<MediaAssetReadRow | null>;
};

// ─── Signer types ─────────────────────────────────────────────────────────────

export type MediaDownloadSignerInput = {
  bucketName: string;
  objectKey: string;
  expiresInSeconds: number;
};

export type MediaDownloadSignerResult = {
  url: string;
  expiresAt: string;
};

export type MediaDownloadSigner = (
  input: MediaDownloadSignerInput,
) => Promise<MediaDownloadSignerResult>;

// ─── Route matching ───────────────────────────────────────────────────────────

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const matchWorkerMediaUrlPath = (
  pathname: string,
  mediaUrlPath: string,
): string | null => {
  const base = mediaUrlPath.endsWith('/') ? mediaUrlPath.slice(0, -1) : mediaUrlPath;
  const match = pathname.match(new RegExp(`^${escapeRegex(base)}/([^/]+)/url$`));
  return match?.[1] ?? null;
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export type HandleWorkerMediaUrlResult =
  | { ok: true; url: string; expiresAt: string; mediaId: string }
  | { ok: false; status: 'not_found' | 'forbidden' | 'download_signer_not_configured' };

const downloadExpiresInSeconds = 900;

export const handleWorkerMediaUrlRequest = async ({
  mediaId,
  config,
  mediaAssetReadRepository,
  mediaDownloadSigner,
}: {
  mediaId: string;
  config: EnvironmentConfig;
  mediaAssetReadRepository: MediaAssetReadRepository;
  mediaDownloadSigner?: MediaDownloadSigner;
}): Promise<HandleWorkerMediaUrlResult> => {
  const asset = await mediaAssetReadRepository.getMediaAsset(mediaId);

  if (!asset) return { ok: false, status: 'not_found' };
  if (asset.visibility === 'private') return { ok: false, status: 'forbidden' };
  if (!mediaDownloadSigner) return { ok: false, status: 'download_signer_not_configured' };

  const signed = await mediaDownloadSigner({
    bucketName: config.cloudflare.r2PublicBucket,
    objectKey: asset.objectKey,
    expiresInSeconds: downloadExpiresInSeconds,
  });

  return { ok: true, url: signed.url, expiresAt: signed.expiresAt, mediaId };
};
