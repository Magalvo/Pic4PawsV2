import { describe, it, expect, vi } from 'vitest';
import {
  handleWorkerUserRegisterRequest,
  validateUserRegistrationPayload,
  type UserRegistrationRepository,
  type UserRegistrationResult,
} from '../../apps/workers/src/user-register';
import {
  createSupabaseUserRegistrationRepositories,
  SupabaseUserRegistrationRepositoryError,
} from '../../apps/workers/src/user-register-supabase';
import type { SupabaseClientLike } from '../../apps/workers/src/pet-supabase';

const makeRequest = (method = 'POST'): Request =>
  new Request('https://example.com/users/register', { method });

const validPayload = {
  email: 'maria@exemplo.pt',
  password: 'senha-de-teste-valida',
  displayName: 'Maria Silva',
  gdprConsentVersion: 'v1',
};

const makeRepo = (result: UserRegistrationResult): UserRegistrationRepository => ({
  registerUser: vi.fn().mockResolvedValue(result),
});

// ---------------------------------------------------------------------------
// validateUserRegistrationPayload
// ---------------------------------------------------------------------------

describe('validateUserRegistrationPayload', () => {
  it('accepts valid payload', () => {
    expect(validateUserRegistrationPayload(validPayload).valid).toBe(true);
  });

  it('returns invalid_body for null', () => {
    const r = validateUserRegistrationPayload(null);
    expect(r.valid).toBe(false);
    expect(!r.valid && r.reasons).toContain('invalid_body');
  });

  it('returns email_required for missing email', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, email: '' });
    expect(!r.valid && r.reasons).toContain('email_required');
  });

  it('returns email_invalid for bad email format', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, email: 'not-an-email' });
    expect(!r.valid && r.reasons).toContain('email_invalid');
  });

  it('returns password_required for missing password', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, password: '' });
    expect(!r.valid && r.reasons).toContain('password_required');
  });

  it('returns password_too_short for password under 8 chars', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, password: '1234567' });
    expect(!r.valid && r.reasons).toContain('password_too_short');
  });

  it('returns display_name_required for missing displayName', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, displayName: '' });
    expect(!r.valid && r.reasons).toContain('display_name_required');
  });

  it('returns gdpr_consent_version_required for missing gdprConsentVersion', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, gdprConsentVersion: '' });
    expect(!r.valid && r.reasons).toContain('gdpr_consent_version_required');
  });

  it('lowercases and trims email in valid result', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, email: '  MARIA@EXEMPLO.PT  ' });
    expect(r.valid && r.input.email).toBe('maria@exemplo.pt');
  });

  it('trims displayName in valid result', () => {
    const r = validateUserRegistrationPayload({ ...validPayload, displayName: '  Maria  ' });
    expect(r.valid && r.input.displayName).toBe('Maria');
  });

  it('accumulates multiple reasons', () => {
    const r = validateUserRegistrationPayload({ email: '', password: '', displayName: '', gdprConsentVersion: '' });
    expect(!r.valid && r.reasons.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// handleWorkerUserRegisterRequest
// ---------------------------------------------------------------------------

describe('handleWorkerUserRegisterRequest', () => {
  it('returns 405 for non-POST requests', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest('GET'),
      payload: validPayload,
    });
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    const body = await res.json() as { status: string };
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 405 for PUT requests', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest('PUT'),
      payload: validPayload,
    });
    expect(res.status).toBe(405);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: { email: 'bad' },
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { status: string; reasons: string[] };
    expect(body.status).toBe('invalid_payload');
    expect(body.reasons).toContain('email_invalid');
    expect(body.reasons).toContain('password_required');
  });

  it('returns 501 when repository is not configured', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: validPayload,
    });
    expect(res.status).toBe(501);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('user_registration_repository_not_configured');
  });

  it('returns 409 when email is already registered', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: validPayload,
      userRegistrationRepository: makeRepo({ ok: false, reason: 'email_already_registered' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('email_already_registered');
  });

  it('returns 201 on successful registration', async () => {
    const res = await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: validPayload,
      userRegistrationRepository: makeRepo({ ok: true }),
      now: () => '2026-06-21T00:00:00.000Z',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('created');
  });

  it('does not require a bearer token', async () => {
    const request = new Request('https://example.com/users/register', { method: 'POST' });
    const res = await handleWorkerUserRegisterRequest({
      request,
      payload: validPayload,
      userRegistrationRepository: makeRepo({ ok: true }),
    });
    expect(res.status).toBe(201);
  });

  it('passes now() result to repository', async () => {
    const fixedNow = '2026-06-21T12:00:00.000Z';
    const repo = makeRepo({ ok: true });
    await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: validPayload,
      userRegistrationRepository: repo,
      now: () => fixedNow,
    });
    expect(repo.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maria@exemplo.pt' }),
      fixedNow,
    );
  });

  it('passes normalised email to repository', async () => {
    const repo = makeRepo({ ok: true });
    await handleWorkerUserRegisterRequest({
      request: makeRequest(),
      payload: { ...validPayload, email: '  MARIA@EXEMPLO.PT  ' },
      userRegistrationRepository: repo,
    });
    expect(repo.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maria@exemplo.pt' }),
      expect.any(String),
    );
  });
});

// ---------------------------------------------------------------------------
// createSupabaseUserRegistrationRepositories
// ---------------------------------------------------------------------------

const makeRpcResult = (error: { message?: string } | null = null) => ({
  data: null,
  error,
  count: null,
});

const makeClient = (rpcResult = makeRpcResult()): SupabaseClientLike => ({
  from: vi.fn() as SupabaseClientLike['from'],
  rpc: vi.fn().mockResolvedValue(rpcResult),
});

const registrationInput = {
  email: 'test@teste.pt',
  password: 'senha-de-teste-valida',
  displayName: 'Teste',
  gdprConsentVersion: 'v1',
};
const registrationNow = '2026-06-21T00:00:00.000Z';

describe('createSupabaseUserRegistrationRepositories', () => {
  it('calls register_user RPC with correct parameters', async () => {
    const client = makeClient();
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({ client });

    await userRegistrationRepository.registerUser(registrationInput, registrationNow);

    expect(client.rpc).toHaveBeenCalledWith('register_user', {
      p_email: 'test@teste.pt',
      p_password: 'senha-de-teste-valida',
      p_display_name: 'Teste',
      p_gdpr_consent_version: 'v1',
      p_gdpr_consent_accepted_at: registrationNow,
    });
  });

  it('returns ok: true on success', async () => {
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({
      client: makeClient(),
    });
    const result = await userRegistrationRepository.registerUser(registrationInput, registrationNow);
    expect(result.ok).toBe(true);
  });

  it('returns email_already_registered when RPC reports user already registered', async () => {
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({
      client: makeClient(makeRpcResult({ message: 'User already registered' })),
    });
    const result = await userRegistrationRepository.registerUser(registrationInput, registrationNow);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('email_already_registered');
  });

  it('returns email_already_registered for case-insensitive match', async () => {
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({
      client: makeClient(makeRpcResult({ message: 'USER ALREADY REGISTERED in auth' })),
    });
    const result = await userRegistrationRepository.registerUser(registrationInput, registrationNow);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('email_already_registered');
  });

  it('throws SupabaseUserRegistrationRepositoryError on unknown RPC error', async () => {
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({
      client: makeClient(makeRpcResult({ message: 'database connection failed' })),
    });
    await expect(
      userRegistrationRepository.registerUser(registrationInput, registrationNow),
    ).rejects.toThrow(SupabaseUserRegistrationRepositoryError);
  });

  it('throws SupabaseUserRegistrationRepositoryError when message is undefined', async () => {
    const { userRegistrationRepository } = createSupabaseUserRegistrationRepositories({
      client: makeClient(makeRpcResult({})),
    });
    await expect(
      userRegistrationRepository.registerUser(registrationInput, registrationNow),
    ).rejects.toThrow(SupabaseUserRegistrationRepositoryError);
  });
});
