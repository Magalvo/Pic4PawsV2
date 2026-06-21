export type UserRegistrationInput = {
  email: string;
  password: string;
  displayName: string;
  gdprConsentVersion: string;
};

export type UserRegistrationResult =
  | { ok: true }
  | { ok: false; reason: 'email_already_registered' };

export type UserRegistrationRepository = {
  registerUser: (input: UserRegistrationInput, now: string) => Promise<UserRegistrationResult>;
};

type ValidateUserRegistrationPayloadResult =
  | { valid: true; input: UserRegistrationInput }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateUserRegistrationPayload = (
  body: unknown,
): ValidateUserRegistrationPayloadResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }

  const b = body as Record<string, unknown>;
  const reasons: string[] = [];

  if (!isNonEmptyString(b.email)) {
    reasons.push('email_required');
  } else if (!EMAIL_REGEX.test((b.email as string).trim())) {
    reasons.push('email_invalid');
  }

  if (!isNonEmptyString(b.password)) {
    reasons.push('password_required');
  } else if ((b.password as string).length < MIN_PASSWORD_LENGTH) {
    reasons.push('password_too_short');
  }

  if (!isNonEmptyString(b.displayName)) {
    reasons.push('display_name_required');
  }

  if (!isNonEmptyString(b.gdprConsentVersion)) {
    reasons.push('gdpr_consent_version_required');
  }

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    input: {
      email: (b.email as string).trim().toLowerCase(),
      password: b.password as string,
      displayName: (b.displayName as string).trim(),
      gdprConsentVersion: (b.gdprConsentVersion as string).trim(),
    },
  };
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export type HandleWorkerUserRegisterRequestInput = {
  request: Request;
  payload: unknown;
  userRegistrationRepository?: UserRegistrationRepository;
  now?: () => string;
};

export const handleWorkerUserRegisterRequest = async ({
  request,
  payload,
  userRegistrationRepository,
  now = () => new Date().toISOString(),
}: HandleWorkerUserRegisterRequestInput): Promise<Response> => {
  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const validation = validateUserRegistrationPayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_payload', reasons: validation.reasons },
      { status: 400 },
    );
  }

  if (!userRegistrationRepository) {
    return jsonResponse(
      { status: 'user_registration_repository_not_configured' },
      { status: 501 },
    );
  }

  const result = await userRegistrationRepository.registerUser(validation.input, now());

  if (!result.ok) {
    return jsonResponse({ status: result.reason }, { status: 409 });
  }

  return jsonResponse({ status: 'created' }, { status: 201 });
};
