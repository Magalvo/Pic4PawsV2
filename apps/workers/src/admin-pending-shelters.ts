import { canVerifyShelter } from '@pic4paws/domain';
import type { ShelterKind } from './shelter-profile';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export type AdminPendingShelterSummary = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: 'pending_review';
  city: string;
  district: string | null;
  countryCode: string;
  publicEmail: string | null;
  publicPhone: string | null;
  logoMediaId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPendingSheltersQuery = {
  limit: number;
  offset: number;
};

export type AdminPendingSheltersResult = {
  shelters: AdminPendingShelterSummary[];
  total: number;
};

export type AdminPendingSheltersRepository = {
  listPendingShelters: (
    query: AdminPendingSheltersQuery,
  ) => Promise<AdminPendingSheltersResult>;
};

export type HandleWorkerAdminPendingSheltersRequestInput = {
  request: Request;
  adminPendingSheltersRepository?: AdminPendingSheltersRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

const parseLimit = (value: string | null): number => {
  if (!value) return 20;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
};

const parseOffset = (value: string | null): number => {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export const matchWorkerAdminPendingSheltersPath = (
  pathname: string,
  shelterPath: string,
): boolean => {
  const base = shelterPath.endsWith('/') ? shelterPath.slice(0, -1) : shelterPath;
  return pathname === `${base}/pending-verification`;
};

export const handleWorkerAdminPendingSheltersRequest = async ({
  request,
  adminPendingSheltersRepository,
  authenticator,
}: HandleWorkerAdminPendingSheltersRequestInput): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!canVerifyShelter(actor)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (!adminPendingSheltersRepository) {
    return jsonResponse(
      { status: 'admin_pending_shelters_repository_not_configured' },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const result = await adminPendingSheltersRepository.listPendingShelters({
    limit: parseLimit(url.searchParams.get('limit')),
    offset: parseOffset(url.searchParams.get('offset')),
  });

  return jsonResponse({
    status: 'ok',
    shelters: result.shelters,
    total: result.total,
  });
};
