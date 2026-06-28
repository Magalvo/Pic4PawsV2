import { describe, expect, it, vi } from 'vitest';
import {
  handleGetPaymentConfigRequest,
  handleSavePaymentConfigRequest,
  validatePaymentConfigPayload,
} from '../../apps/workers/src/shelter-payment-config';
import type { ShelterPaymentConfigRepository } from '../../apps/workers/src/shelter-payment-config';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const SHELTER_ID = 'shelter-aaa';
const OTHER_SHELTER_ID = 'shelter-bbb';
const VALID_IBAN = 'PT50000201231234567890154';

const makeActor = (shelterId = SHELTER_ID): AuthenticatedActor => ({
  id: 'user-001',
  authUserId: 'auth-001',
  role: 'shelter_owner',
  status: 'active',
  memberships: [
    { id: 'mem-001', userId: 'user-001', shelterId, role: 'shelter_owner', deletedAt: null },
  ],
});

const makeAuthenticator = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  vi.fn().mockResolvedValue(actor);

const makeGetRepo = (record: Awaited<ReturnType<ShelterPaymentConfigRepository['getPaymentConfig']>>): ShelterPaymentConfigRepository => ({
  getPaymentConfig: vi.fn().mockResolvedValue(record),
  savePaymentConfig: vi.fn().mockResolvedValue(undefined),
  checkPendingPaymentDonations: vi.fn().mockResolvedValue(false),
});

const makeSaveRepo = (hasPending = false): ShelterPaymentConfigRepository => ({
  getPaymentConfig: vi.fn().mockResolvedValue(null),
  savePaymentConfig: vi.fn().mockResolvedValue(undefined),
  checkPendingPaymentDonations: vi.fn().mockResolvedValue(hasPending),
});

const makeRequest = (method: string): Request =>
  new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, { method });

// ─── validatePaymentConfigPayload ─────────────────────────────────────────────

describe('validatePaymentConfigPayload', () => {
  it('returns valid for IBAN-only payload', () => {
    const result = validatePaymentConfigPayload({ iban: VALID_IBAN });
    expect(result.valid).toBe(true);
  });

  it('returns valid for IBAN + mbWayPhone', () => {
    const result = validatePaymentConfigPayload({ iban: VALID_IBAN, mbWayPhone: '+351912345678' });
    expect(result.valid).toBe(true);
  });

  it('accepts null mbWayPhone', () => {
    const result = validatePaymentConfigPayload({ iban: VALID_IBAN, mbWayPhone: null });
    expect(result.valid).toBe(true);
  });

  it('rejects missing iban', () => {
    const result = validatePaymentConfigPayload({ mbWayPhone: '+351912345678' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('iban_required');
  });

  it('rejects empty iban string', () => {
    const result = validatePaymentConfigPayload({ iban: '   ' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('iban_required');
  });

  it('rejects non-string iban', () => {
    const result = validatePaymentConfigPayload({ iban: 12345 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('iban_required');
  });

  it('rejects non-object body', () => {
    const result = validatePaymentConfigPayload(null);
    expect(result.valid).toBe(false);
  });
});

// ─── GET handler ──────────────────────────────────────────────────────────────

describe('handleGetPaymentConfigRequest', () => {
  it('returns 405 for non-GET method', async () => {
    const res = await handleGetPaymentConfigRequest({
      request: makeRequest('POST'),
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleGetPaymentConfigRequest({
      request: new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`),
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when no authenticator', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
    });
    expect(res.status).toBe(501);
  });

  it('returns 401 when bearer is invalid (actor null)', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer bad' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
      authenticator: makeAuthenticator(null),
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a member of the target shelter', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
      authenticator: makeAuthenticator(makeActor(OTHER_SHELTER_ID)),
    });
    expect(res.status).toBe(403);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 200 with configured:false when no config row exists', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo(null),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; configured: boolean };
    expect(body.status).toBe('ok');
    expect(body.configured).toBe(false);
  });

  it('returns 200 with config data when row exists', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo({ tier: 'manual', iban: VALID_IBAN, mbWayPhone: '+351912345678', activeProvider: null, eupagoApiKeyConfigured: false, ifthenpayAntiPhishingKeyConfigured: false }),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.configured).toBe(true);
    expect(body.tier).toBe('manual');
    expect(body.iban).toBe(VALID_IBAN);
    expect(body.mbWayPhone).toBe('+351912345678');
  });
});

// ─── POST handler ─────────────────────────────────────────────────────────────

describe('handleSavePaymentConfigRequest', () => {
  it('returns 405 for non-POST method', async () => {
    const res = await handleSavePaymentConfigRequest({
      request: makeRequest('PATCH'),
      payload: { iban: VALID_IBAN },
      shelterId: SHELTER_ID,
      repository: makeSaveRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleSavePaymentConfigRequest({
      request: makeRequest('POST'),
      payload: { iban: VALID_IBAN },
      shelterId: SHELTER_ID,
      repository: makeSaveRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a member', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { iban: VALID_IBAN },
      shelterId: SHELTER_ID,
      repository: makeSaveRepo(),
      authenticator: makeAuthenticator(makeActor(OTHER_SHELTER_ID)),
    });
    expect(res.status).toBe(403);
  });

  it('returns 400 when iban is missing', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { mbWayPhone: '+351912345678' },
      shelterId: SHELTER_ID,
      repository: makeSaveRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { status: string; reasons: string[] };
    expect(body.status).toBe('invalid_config');
    expect(body.reasons).toContain('iban_required');
  });

  it('returns 200 with payment_config_saved on valid IBAN', async () => {
    const repo = makeSaveRepo();
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { iban: VALID_IBAN },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('payment_config_saved');
    expect(body.tier).toBe('manual');
    expect(body.iban).toBe(VALID_IBAN);
    expect(body.mbWayPhone).toBeNull();
    expect(repo.savePaymentConfig).toHaveBeenCalledWith(
      SHELTER_ID,
      { tier: 'manual', iban: VALID_IBAN, mbWayPhone: null, activeProvider: null, eupagoApiKeyEncrypted: null, eupagoWebhookSecretEncrypted: null, ifthenpayAntiPhishingKey: null },
    );
  });

  it('returns 200 with mbWayPhone when provided', async () => {
    const repo = makeSaveRepo();
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { iban: VALID_IBAN, mbWayPhone: '+351912345678' },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.mbWayPhone).toBe('+351912345678');
    expect(repo.savePaymentConfig).toHaveBeenCalledWith(
      SHELTER_ID,
      { tier: 'manual', iban: VALID_IBAN, mbWayPhone: '+351912345678', activeProvider: null, eupagoApiKeyEncrypted: null, eupagoWebhookSecretEncrypted: null, ifthenpayAntiPhishingKey: null },
    );
  });

  it('returns 501 when repository not configured', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { iban: VALID_IBAN },
      shelterId: SHELTER_ID,
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(501);
  });
});

// ─── validatePaymentConfigPayload — automated tier ────────────────────────────

describe('validatePaymentConfigPayload — automated tier', () => {
  it('tier=automated without activeProvider → invalid', () => {
    const result = validatePaymentConfigPayload({ tier: 'automated' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('active_provider_required');
  });

  it('tier=automated with unknown activeProvider → invalid', () => {
    const result = validatePaymentConfigPayload({ tier: 'automated', activeProvider: 'stripe' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('active_provider_required');
  });

  it('tier=automated eupago without eupagoApiKey → invalid', () => {
    const result = validatePaymentConfigPayload({
      tier: 'automated',
      activeProvider: 'eupago',
      eupagoWebhookSecret: 'sec',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('eupago_api_key_required');
  });

  it('tier=automated eupago without eupagoWebhookSecret → invalid', () => {
    const result = validatePaymentConfigPayload({
      tier: 'automated',
      activeProvider: 'eupago',
      eupagoApiKey: 'key',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('eupago_webhook_secret_required');
  });

  it('tier=automated eupago with all fields → valid', () => {
    const result = validatePaymentConfigPayload({
      tier: 'automated',
      activeProvider: 'eupago',
      eupagoApiKey: 'key',
      eupagoWebhookSecret: 'sec',
    });
    expect(result.valid).toBe(true);
  });

  it('tier=automated ifthenpay without key → invalid', () => {
    const result = validatePaymentConfigPayload({ tier: 'automated', activeProvider: 'ifthenpay' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('ifthenpay_anti_phishing_key_required');
  });

  it('tier=automated ifthenpay with key → valid', () => {
    const result = validatePaymentConfigPayload({
      tier: 'automated',
      activeProvider: 'ifthenpay',
      ifthenpayAntiPhishingKey: 'key-123',
    });
    expect(result.valid).toBe(true);
  });

  it('omitting tier defaults to manual tier validation', () => {
    const result = validatePaymentConfigPayload({ iban: VALID_IBAN });
    expect(result.valid).toBe(true);
  });
});

// ─── POST handler — automated tier + provider-switch guard ────────────────────

const ENCRYPTION_SECRET = 'aaaabbbbccccddddeeeeffffgggghhhh'; // 32 bytes

describe('handleSavePaymentConfigRequest — automated tier', () => {
  it('saves eupago config with encrypted credentials', async () => {
    const repo = makeSaveRepo();
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { tier: 'automated', activeProvider: 'eupago', eupagoApiKey: 'api-key', eupagoWebhookSecret: 'wh-secret' },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
      encryptionSecret: ENCRYPTION_SECRET,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('payment_config_saved');
    expect(body.tier).toBe('automated');
    expect(body.activeProvider).toBe('eupago');
    expect(repo.savePaymentConfig).toHaveBeenCalledOnce();
    const [, savedInput] = (repo.savePaymentConfig as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
    // credentials must be encrypted — not the raw values
    expect(savedInput['eupagoApiKeyEncrypted']).toBeDefined();
    expect(savedInput['eupagoApiKeyEncrypted']).not.toBe('api-key');
    expect(savedInput['eupagoWebhookSecretEncrypted']).toBeDefined();
    expect(savedInput['eupagoWebhookSecretEncrypted']).not.toBe('wh-secret');
  });

  it('returns 503 when encryptionSecret is missing for eupago automated tier', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { tier: 'automated', activeProvider: 'eupago', eupagoApiKey: 'key', eupagoWebhookSecret: 'sec' },
      shelterId: SHELTER_ID,
      repository: makeSaveRepo(),
      authenticator: makeAuthenticator(makeActor()),
      encryptionSecret: null,
    });
    expect(res.status).toBe(503);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('encryption_not_configured');
  });

  it('saves ifthenpay config without encryption', async () => {
    const repo = makeSaveRepo();
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { tier: 'automated', activeProvider: 'ifthenpay', ifthenpayAntiPhishingKey: 'anti-phishing-123' },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('payment_config_saved');
    expect(body.activeProvider).toBe('ifthenpay');
    const [, savedInput] = (repo.savePaymentConfig as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
    expect(savedInput['ifthenpayAntiPhishingKey']).toBe('anti-phishing-123');
  });

  it('provider switch with pending payments returns 409', async () => {
    const repo: ShelterPaymentConfigRepository = {
      getPaymentConfig: vi.fn().mockResolvedValue({
        tier: 'automated',
        iban: null,
        mbWayPhone: null,
        activeProvider: 'ifthenpay',
        eupagoApiKeyConfigured: false,
        ifthenpayAntiPhishingKeyConfigured: true,
      }),
      savePaymentConfig: vi.fn().mockResolvedValue(undefined),
      checkPendingPaymentDonations: vi.fn().mockResolvedValue(true),
    };
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { tier: 'automated', activeProvider: 'eupago', eupagoApiKey: 'key', eupagoWebhookSecret: 'sec' },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
      encryptionSecret: ENCRYPTION_SECRET,
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('provider_switch_blocked');
    expect(repo.savePaymentConfig).not.toHaveBeenCalled();
  });

  it('provider switch allowed when no pending payments', async () => {
    const repo: ShelterPaymentConfigRepository = {
      getPaymentConfig: vi.fn().mockResolvedValue({
        tier: 'automated',
        iban: null,
        mbWayPhone: null,
        activeProvider: 'ifthenpay',
        eupagoApiKeyConfigured: false,
        ifthenpayAntiPhishingKeyConfigured: true,
      }),
      savePaymentConfig: vi.fn().mockResolvedValue(undefined),
      checkPendingPaymentDonations: vi.fn().mockResolvedValue(false),
    };
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleSavePaymentConfigRequest({
      request: req,
      payload: { tier: 'automated', activeProvider: 'eupago', eupagoApiKey: 'key', eupagoWebhookSecret: 'sec' },
      shelterId: SHELTER_ID,
      repository: repo,
      authenticator: makeAuthenticator(makeActor()),
      encryptionSecret: ENCRYPTION_SECRET,
    });
    expect(res.status).toBe(200);
  });
});

// ─── GET handler — extended response ─────────────────────────────────────────

describe('handleGetPaymentConfigRequest — provider fields', () => {
  it('returns activeProvider and presence flags for automated config', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo({
        tier: 'automated',
        iban: null,
        mbWayPhone: null,
        activeProvider: 'eupago',
        eupagoApiKeyConfigured: true,
        ifthenpayAntiPhishingKeyConfigured: false,
      }),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.activeProvider).toBe('eupago');
    expect(body.eupagoApiKeyConfigured).toBe(true);
    expect(body.ifthenpayAntiPhishingKeyConfigured).toBe(false);
  });

  it('never returns raw encrypted credential values in GET response', async () => {
    const req = new Request(`https://worker.test/shelters/${SHELTER_ID}/payment-config`, {
      headers: { Authorization: 'Bearer tok' },
    });
    const res = await handleGetPaymentConfigRequest({
      request: req,
      shelterId: SHELTER_ID,
      repository: makeGetRepo({
        tier: 'automated',
        iban: null,
        mbWayPhone: null,
        activeProvider: 'eupago',
        eupagoApiKeyConfigured: true,
        ifthenpayAntiPhishingKeyConfigured: false,
      }),
      authenticator: makeAuthenticator(makeActor()),
    });
    const body = await res.json() as Record<string, unknown>;
    expect(body['eupagoApiKeyEncrypted']).toBeUndefined();
    expect(body['eupagoWebhookSecretEncrypted']).toBeUndefined();
    expect(body['ifthenpayAntiPhishingKey']).toBeUndefined();
  });
});
