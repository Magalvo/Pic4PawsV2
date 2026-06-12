import { describe, expect, it } from 'vitest';
import {
  handleWorkerShelterRegistrationRequest,
  validateShelterRegistrationPayload,
  KNOWN_SHELTER_KINDS,
} from '../../apps/workers/src/shelter-register';
import type { ShelterRegistrationRepository } from '../../apps/workers/src/shelter-register';
import type { AuthenticatedActor } from '@pic4paws/domain';

const makeActor = (userId = 'user-1'): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'shelter_member',
  status: 'active',
  memberships: [],
});

const makeAuth = (actor: AuthenticatedActor | null = makeActor()) =>
  async () => actor;

const makeRepo = (shelterId = 'shelter-new'): ShelterRegistrationRepository => ({
  registerShelter: async () => ({ shelterId }),
});

const baseRequest = (
  method = 'POST',
  token: string | null = 'valid-token',
) =>
  new Request('https://worker.test/shelters', {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const validPayload = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
};

// ─── validateShelterRegistrationPayload ────────────────────────────────────────

describe('validateShelterRegistrationPayload', () => {
  it('returns valid for a minimal payload', () => {
    const result = validateShelterRegistrationPayload(validPayload);
    expect(result.valid).toBe(true);
  });

  it('returns valid for a full payload', () => {
    const result = validateShelterRegistrationPayload({
      ...validPayload,
      publicEmail: 'info@canil.pt',
      publicPhone: '+351910000000',
      description: 'Abrigo municipal de Lisboa.',
      district: 'Lisboa',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.input.publicEmail).toBe('info@canil.pt');
      expect(result.input.district).toBe('Lisboa');
    }
  });

  it('trims name and city whitespace', () => {
    const result = validateShelterRegistrationPayload({ name: '  Canil  ', kind: 'shelter', city: '  Porto  ' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.input.name).toBe('Canil');
      expect(result.input.city).toBe('Porto');
    }
  });

  it('returns invalid_body for null', () => {
    const result = validateShelterRegistrationPayload(null);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('invalid_body');
  });

  it('returns name_required when name is missing', () => {
    const result = validateShelterRegistrationPayload({ kind: 'shelter', city: 'Lisboa' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('name_required');
  });

  it('returns city_required when city is missing', () => {
    const result = validateShelterRegistrationPayload({ name: 'Canil', kind: 'shelter' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('city_required');
  });

  it('returns kind_invalid for unknown kind', () => {
    const result = validateShelterRegistrationPayload({ name: 'Canil', kind: 'unknown', city: 'Lisboa' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('kind_invalid');
  });

  it('accepts all KNOWN_SHELTER_KINDS', () => {
    for (const kind of KNOWN_SHELTER_KINDS) {
      const result = validateShelterRegistrationPayload({ name: 'Canil', kind, city: 'Lisboa' });
      expect(result.valid).toBe(true);
    }
  });

  it('nullifies optional empty-string fields', () => {
    const result = validateShelterRegistrationPayload({
      ...validPayload,
      publicEmail: '   ',
      district: '',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.input.publicEmail).toBeNull();
      expect(result.input.district).toBeNull();
    }
  });
});

// ─── handleWorkerShelterRegistrationRequest ────────────────────────────────────

describe('handleWorkerShelterRegistrationRequest', () => {
  it('returns 405 for non-POST method', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest('GET'),
      payload: validPayload,
      shelterRegistrationRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(405);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest('POST', null),
      payload: validPayload,
      shelterRegistrationRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator is not configured', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest(),
      payload: validPayload,
      shelterRegistrationRepository: makeRepo(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest(),
      payload: validPayload,
      shelterRegistrationRepository: makeRepo(),
      authenticator: makeAuth(null),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest(),
      payload: { name: '', kind: 'shelter', city: 'Lisboa' },
      shelterRegistrationRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('invalid_payload');
    expect(Array.isArray(body.reasons)).toBe(true);
  });

  it('returns 501 when repository is not configured', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest(),
      payload: validPayload,
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('shelter_registration_repository_not_configured');
  });

  it('returns 201 with shelterId on success', async () => {
    const res = await handleWorkerShelterRegistrationRequest({
      request: baseRequest(),
      payload: validPayload,
      shelterRegistrationRepository: makeRepo('shelter-abc'),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('created');
    expect(body.shelterId).toBe('shelter-abc');
  });
});
