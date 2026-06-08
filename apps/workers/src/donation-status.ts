import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { DonationKind, DonationPaymentMethod } from './donation';
import type { DonationStatus } from './donation-list';

export type DonationStatusRecord = {
  donationId: string;
  donorUserId: string;
  shelterId: string;
  petId: string | null;
  kind: DonationKind;
  donationStatus: DonationStatus;
  amountCents: number;
  currency: string;
  paymentMethod: DonationPaymentMethod;
  createdAt: string;
};

export type DonationStatusRepository = {
  getDonationStatus: (donationId: string) => Promise<DonationStatusRecord | null>;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

/**
 * Returns the donationId segment from a URL pathname of the form
 * `{donationsPath}/{donationId}`, or null if it does not match that
 * exact single-segment pattern.
 *
 * Examples (donationsPath = '/donations'):
 *   /donations/abc-123         → 'abc-123'
 *   /donations                 → null  (no segment — that is the create endpoint)
 *   /donations/abc/extra       → null  (too many segments)
 *   /shelters/abc/donations    → null  (wrong prefix)
 */
export const matchWorkerDonationStatusId = (
  pathname: string,
  donationsPath: string,
): string | null => {
  const prefix = donationsPath.endsWith('/') ? donationsPath : `${donationsPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);

  if (!rest || rest.includes('/')) return null;

  return rest;
};

export type HandleWorkerDonationStatusRequestInput = {
  request: Request;
  donationId: string;
  donationStatusRepository?: DonationStatusRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerDonationStatusRequest = async ({
  request,
  donationId,
  donationStatusRepository,
  authenticator,
}: HandleWorkerDonationStatusRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  // 2. Bearer token
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 3. Authenticator configured
  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  // 4. Authenticate
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 5. Repository configured
  if (!donationStatusRepository) {
    return jsonResponse(
      { status: 'donation_status_repository_not_configured' },
      { status: 501 },
    );
  }

  // 6. Load donation
  const record = await donationStatusRepository.getDonationStatus(donationId);
  if (!record) {
    return jsonResponse({ status: 'donation_not_found' }, { status: 404 });
  }

  // 7. Access control — only the donor may view their own donation status
  if (actor.id !== record.donorUserId) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 8. Success — omit donorUserId from the response
  const { donorUserId: _omitted, ...publicRecord } = record;
  void _omitted;

  return jsonResponse({ status: 'ok', donation: publicRecord }, { status: 200 });
};
