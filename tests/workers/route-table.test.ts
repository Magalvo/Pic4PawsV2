import { describe, expect, it } from 'vitest';
import { handle as handleWebhooks } from '../../apps/workers/src/routes/webhooks';
import { handle as handleMedia } from '../../apps/workers/src/routes/media';
import { handle as handlePets } from '../../apps/workers/src/routes/pets';
import { handle as handleShelters } from '../../apps/workers/src/routes/shelters';
import { handle as handleAdoptions } from '../../apps/workers/src/routes/adoptions';
import { handle as handleDonations } from '../../apps/workers/src/routes/donations';
import { handle as handleSponsorships } from '../../apps/workers/src/routes/sponsorships';
import { handle as handleNotifications } from '../../apps/workers/src/routes/notifications';
import { matchWorkerShelterVerificationId } from '../../apps/workers/src/shelter-verify';
import { matchWorkerAdminPendingSheltersPath } from '../../apps/workers/src/admin-pending-shelters';
import { matchWorkerShelterProfileId } from '../../apps/workers/src/shelter-profile';
import { matchWorkerPushTokenPath } from '../../apps/workers/src/push-token';
import { matchWorkerNotificationsPath } from '../../apps/workers/src/notification';
import type { WorkerParsedConfig } from '../../apps/workers/src/routes/shared';

const PATHS = {
  webhook: '/webhooks/payment',
  media: '/media/upload',
  petFeed: '/pets',
  petDrafts: '/pets/drafts',
  shelter: '/shelters',
  adoption: '/adoptions',
  donation: '/donations',
  sponsorship: '/sponsorships',
  notification: '/notifications',
} as const;

const config = {
  workers: {
    paymentWebhookPath: PATHS.webhook,
    mediaUploadPath: PATHS.media,
    petFeedPath: PATHS.petFeed,
    petDraftsPath: PATHS.petDrafts,
    shelterPath: PATHS.shelter,
    adoptionsPath: PATHS.adoption,
    donationsPath: PATHS.donation,
    sponsorshipsPath: PATHS.sponsorship,
    notificationsPath: PATHS.notification,
  },
  payments: { primaryProvider: 'stripe' },
  app: { environment: 'test' },
} as unknown as WorkerParsedConfig;

const deps = {};

const get = (path: string) => new Request(`https://w.test${path}`, { method: 'GET' });

describe('route-table: domain isolation (each handler returns null for foreign paths)', () => {
  const foreignPaths = [
    PATHS.webhook,
    PATHS.media,
    PATHS.petFeed,
    PATHS.shelter,
    PATHS.adoption,
    PATHS.donation,
    PATHS.sponsorship,
    PATHS.notification,
    '/unknown',
  ];

  const handlers = [
    { name: 'webhooks', handle: handleWebhooks, own: PATHS.webhook },
    { name: 'media', handle: handleMedia, own: PATHS.media },
    { name: 'shelters', handle: handleShelters, own: PATHS.shelter },
    { name: 'adoptions', handle: handleAdoptions, own: PATHS.adoption },
    { name: 'donations', handle: handleDonations, own: PATHS.donation },
    { name: 'sponsorships', handle: handleSponsorships, own: PATHS.sponsorship },
    { name: 'notifications', handle: handleNotifications, own: PATHS.notification },
  ] as const;

  for (const { name, handle, own } of handlers) {
    const foreign = foreignPaths.filter((p) => p !== own);
    it(`${name} returns null for ${foreign.length} foreign paths`, async () => {
      for (const path of foreign) {
        const result = await handle(get(path), config, deps);
        expect(result, `${name} should return null for ${path}`).toBeNull();
      }
    });
  }
});

describe('route-table: method guards (405 before any repository access)', () => {
  it('webhooks: GET to webhook path → 405', async () => {
    const response = await handleWebhooks(get(PATHS.webhook), config, deps);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(405);
  });

  it('media: GET to media upload path → 405', async () => {
    const response = await handleMedia(get(PATHS.media), config, deps);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(405);
  });
});

describe('route-table: ROUTE_HANDLERS ordering contract', () => {
  it('webhooks handler is tried before pets handler', async () => {
    // Webhook path must never fall through to pets module
    const petsResult = await handlePets(get(PATHS.webhook), config, deps);
    expect(petsResult).toBeNull();
  });

  it('adoptions handler does not claim shelter-prefixed adoption list paths', async () => {
    // Adoption list uses shelterPath prefix → belongs to shelters module
    const adoptionListPath = `${PATHS.shelter}/abc123/adoptions`;
    const result = await handleAdoptions(get(adoptionListPath), config, deps);
    expect(result).toBeNull();
  });

  it('donations handler does not claim shelter-prefixed donation list paths', async () => {
    const donationListPath = `${PATHS.shelter}/abc123/donations`;
    const result = await handleDonations(get(donationListPath), config, deps);
    expect(result).toBeNull();
  });

  it('sponsorships handler does not claim shelter-prefixed sponsorship list paths', async () => {
    const sponsorshipListPath = `${PATHS.shelter}/abc123/sponsorships`;
    const result = await handleSponsorships(get(sponsorshipListPath), config, deps);
    expect(result).toBeNull();
  });

  it('matchWorkerShelterVerificationId claims verification path before matchWorkerShelterProfileId', () => {
    const verificationPath = `${PATHS.shelter}/abc123/verification`;
    expect(matchWorkerShelterVerificationId(verificationPath, PATHS.shelter)).toBe('abc123');
    expect(matchWorkerShelterProfileId(verificationPath, PATHS.shelter)).toBeNull();
  });

  it('admin pending shelters route is reserved before public shelter profile matching', () => {
    const pendingPath = `${PATHS.shelter}/pending-verification`;
    expect(matchWorkerAdminPendingSheltersPath(pendingPath, PATHS.shelter)).toBe(true);
    expect(matchWorkerShelterProfileId(pendingPath, PATHS.shelter)).toBe('pending-verification');
  });

  it('matchWorkerPushTokenPath claims push-token sub-path; matchWorkerNotificationsPath does not', () => {
    const pushTokenPath = `${PATHS.notification}/push-token`;
    expect(matchWorkerPushTokenPath(pushTokenPath, PATHS.notification)).toBe(true);
    expect(matchWorkerNotificationsPath(pushTokenPath, PATHS.notification)).toBe(false);
  });
});
