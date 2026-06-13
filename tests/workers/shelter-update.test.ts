import { describe, expect, it } from 'vitest';
import {
  handleWorkerShelterUpdateRequest,
  validateShelterUpdatePayload,
} from '../../apps/workers/src/shelter-update';
import type { ShelterUpdateRepository } from '../../apps/workers/src/shelter-update';
import type { AuthenticatedActor } from '@pic4paws/domain';

const makeActor = (
  userId = 'user-1',
  shelterId = 'shelter-a',
): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'shelter_member',
  status: 'active',
  memberships: [
    { id: 'membership-1', userId, shelterId, role: 'shelter_member', deletedAt: null },
  ],
});

const makeAuth = (actor: AuthenticatedActor | null = makeActor()) =>
  async () => actor;

const makeRepo = (
  result: { shelterId: string } | null = { shelterId: 'shelter-a' },
): ShelterUpdateRepository => ({
  updateShelter: async () => result,
});

const baseRequest = (method = 'PATCH', token: string | null = 'valid-token') =>
  new Request('https://worker.test/shelters/shelter-a', {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const validPayload = { name: 'Canil Atualizado' };

// ─── validateShelterUpdatePayload ─────────────────────────────────────────────

describe('validateShelterUpdatePayload', () => {
  it('returns valid for a single field', () => {
    const result = validateShelterUpdatePayload({ name: 'Novo Nome' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.input.name).toBe('Novo Nome');
  });

  it('trims string fields', () => {
    const result = validateShelterUpdatePayload({ name: '  Novo  ', city: '  Porto  ' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.input.name).toBe('Novo');
      expect(result.input.city).toBe('Porto');
    }
  });

  it('accepts null for nullable fields', () => {
    const result = validateShelterUpdatePayload({ district: null, publicEmail: null });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.input.district).toBeNull();
      expect(result.input.publicEmail).toBeNull();
    }
  });

  it('accepts all updateable fields together', () => {
    const result = validateShelterUpdatePayload({
      name: 'X',
      kind: 'sanctuary',
      city: 'Porto',
      district: 'Norte',
      publicEmail: 'x@x.pt',
      publicPhone: '+351',
      description: 'Desc',
    });
    expect(result.valid).toBe(true);
  });

  it('returns no_fields_provided for empty object', () => {
    const result = validateShelterUpdatePayload({});
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('no_fields_provided');
  });

  it('returns invalid_body for null', () => {
    const result = validateShelterUpdatePayload(null);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('invalid_body');
  });

  it('returns name_invalid when name is empty string', () => {
    const result = validateShelterUpdatePayload({ name: '   ' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('name_invalid');
  });

  it('returns kind_invalid for unknown kind', () => {
    const result = validateShelterUpdatePayload({ kind: 'unknown' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('kind_invalid');
  });

  it('returns city_invalid when city is empty string', () => {
    const result = validateShelterUpdatePayload({ city: '' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('city_invalid');
  });

  it('does not include fields not present in the payload', () => {
    const result = validateShelterUpdatePayload({ name: 'Only Name' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect('city' in result.input).toBe(false);
      expect('kind' in result.input).toBe(false);
    }
  });
});

// ─── handleWorkerShelterUpdateRequest ─────────────────────────────────────────

describe('handleWorkerShelterUpdateRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest('GET'),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(405);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest('PATCH', null),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator is not configured', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(),
      authenticator: makeAuth(null),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 403 when actor is not a member of the shelter', async () => {
    const otherActor = makeActor('user-1', 'other-shelter');
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(),
      authenticator: makeAuth(otherActor),
    });
    expect(res.status).toBe(403);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('forbidden');
  });

  it('returns 400 for invalid payload (empty object)', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: {},
      shelterUpdateRepository: makeRepo(),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('invalid_payload');
    expect(Array.isArray(body.reasons)).toBe(true);
  });

  it('returns 501 when repository is not configured', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('shelter_update_repository_not_configured');
  });

  it('returns 404 when shelter is not found', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo(null),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('shelter_not_found');
  });

  it('returns 200 with shelterId on success', async () => {
    const res = await handleWorkerShelterUpdateRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      payload: validPayload,
      shelterUpdateRepository: makeRepo({ shelterId: 'shelter-a' }),
      authenticator: makeAuth(),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('updated');
    expect(body.shelterId).toBe('shelter-a');
  });
});
