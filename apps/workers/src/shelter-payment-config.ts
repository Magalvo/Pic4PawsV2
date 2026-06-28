import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import { encryptCredential } from './crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShelterActiveProvider = 'ifthenpay' | 'eupago';

export type ShelterPaymentConfigInput =
  | {
      tier: 'manual';
      iban: string;
      mbWayPhone: string | null;
      activeProvider: null;
      eupagoApiKeyEncrypted: null;
      eupagoWebhookSecretEncrypted: null;
      ifthenpayAntiPhishingKey: null;
    }
  | {
      tier: 'automated';
      activeProvider: 'eupago';
      iban: null;
      mbWayPhone: null;
      eupagoApiKeyEncrypted: string;
      eupagoWebhookSecretEncrypted: string;
      ifthenpayAntiPhishingKey: null;
    }
  | {
      tier: 'automated';
      activeProvider: 'ifthenpay';
      iban: null;
      mbWayPhone: null;
      eupagoApiKeyEncrypted: null;
      eupagoWebhookSecretEncrypted: null;
      ifthenpayAntiPhishingKey: string;
    };

export type ShelterPaymentConfigRecord = {
  tier: 'manual' | 'automated';
  iban: string | null;
  mbWayPhone: string | null;
  activeProvider: ShelterActiveProvider | null;
  eupagoApiKeyConfigured: boolean;
  ifthenpayAntiPhishingKeyConfigured: boolean;
};

export type ShelterPaymentConfigRepository = {
  getPaymentConfig: (shelterId: string) => Promise<ShelterPaymentConfigRecord | null>;
  savePaymentConfig: (shelterId: string, input: ShelterPaymentConfigInput) => Promise<void>;
  checkPendingPaymentDonations: (shelterId: string) => Promise<boolean>;
};

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidatedManualInput = { tier: 'manual'; iban: string; mbWayPhone: string | null };
type ValidatedEupagoInput = {
  tier: 'automated';
  activeProvider: 'eupago';
  eupagoApiKey: string;
  eupagoWebhookSecret: string;
};
type ValidatedIfthenpayInput = {
  tier: 'automated';
  activeProvider: 'ifthenpay';
  ifthenpayAntiPhishingKey: string;
};
type ValidatedInput = ValidatedManualInput | ValidatedEupagoInput | ValidatedIfthenpayInput;

type ValidatePaymentConfigResult =
  | { valid: true; input: ValidatedInput }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const validatePaymentConfigPayload = (body: unknown): ValidatePaymentConfigResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }

  const b = body as Record<string, unknown>;
  const tier = b.tier ?? 'manual';

  if (tier === 'automated') {
    const activeProvider = b.activeProvider;
    if (activeProvider !== 'eupago' && activeProvider !== 'ifthenpay') {
      return { valid: false, reasons: ['active_provider_required'] };
    }

    if (activeProvider === 'eupago') {
      const reasons: string[] = [];
      if (!isNonEmptyString(b.eupagoApiKey)) reasons.push('eupago_api_key_required');
      if (!isNonEmptyString(b.eupagoWebhookSecret)) reasons.push('eupago_webhook_secret_required');
      if (reasons.length > 0) return { valid: false, reasons };
      return {
        valid: true,
        input: {
          tier: 'automated',
          activeProvider: 'eupago',
          eupagoApiKey: (b.eupagoApiKey as string).trim(),
          eupagoWebhookSecret: (b.eupagoWebhookSecret as string).trim(),
        },
      };
    }

    if (!isNonEmptyString(b.ifthenpayAntiPhishingKey)) {
      return { valid: false, reasons: ['ifthenpay_anti_phishing_key_required'] };
    }
    return {
      valid: true,
      input: {
        tier: 'automated',
        activeProvider: 'ifthenpay',
        ifthenpayAntiPhishingKey: (b.ifthenpayAntiPhishingKey as string).trim(),
      },
    };
  }

  // manual tier (default)
  const reasons: string[] = [];
  if (!isNonEmptyString(b.iban)) reasons.push('iban_required');
  if (reasons.length > 0) return { valid: false, reasons };

  const iban = (b.iban as string).trim().toUpperCase();
  const mbWayPhone =
    typeof b.mbWayPhone === 'string' && b.mbWayPhone.trim().length > 0
      ? b.mbWayPhone.trim()
      : null;

  return { valid: true, input: { tier: 'manual', iban, mbWayPhone } };
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

// ─── GET handler ──────────────────────────────────────────────────────────────

export type HandleGetPaymentConfigRequestInput = {
  request: Request;
  shelterId: string;
  repository?: ShelterPaymentConfigRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleGetPaymentConfigRequest = async ({
  request,
  shelterId,
  repository,
  authenticator,
}: HandleGetPaymentConfigRequestInput): Promise<Response> => {
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

  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (!repository) {
    return jsonResponse({ status: 'payment_config_repository_not_configured' }, { status: 501 });
  }

  const record = await repository.getPaymentConfig(shelterId);

  if (!record) {
    return jsonResponse({ status: 'ok', configured: false }, { status: 200 });
  }

  return jsonResponse(
    {
      status: 'ok',
      configured: true,
      tier: record.tier,
      iban: record.iban,
      mbWayPhone: record.mbWayPhone,
      activeProvider: record.activeProvider,
      eupagoApiKeyConfigured: record.eupagoApiKeyConfigured,
      ifthenpayAntiPhishingKeyConfigured: record.ifthenpayAntiPhishingKeyConfigured,
    },
    { status: 200 },
  );
};

// ─── POST handler ─────────────────────────────────────────────────────────────

export type HandleSavePaymentConfigRequestInput = {
  request: Request;
  payload: unknown;
  shelterId: string;
  repository?: ShelterPaymentConfigRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  encryptionSecret?: string | null;
};

export const handleSavePaymentConfigRequest = async ({
  request,
  payload,
  shelterId,
  repository,
  authenticator,
  encryptionSecret,
}: HandleSavePaymentConfigRequestInput): Promise<Response> => {
  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
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

  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  const validation = validatePaymentConfigPayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_config', reasons: validation.reasons }, { status: 400 });
  }

  if (!repository) {
    return jsonResponse({ status: 'payment_config_repository_not_configured' }, { status: 501 });
  }

  const validated = validation.input;

  // Provider-switch guard
  if (validated.tier === 'automated') {
    const currentConfig = await repository.getPaymentConfig(shelterId);
    const currentProvider = currentConfig?.activeProvider ?? null;
    if (currentProvider !== null && currentProvider !== validated.activeProvider) {
      const hasPending = await repository.checkPendingPaymentDonations(shelterId);
      if (hasPending) {
        return jsonResponse({ status: 'provider_switch_blocked' }, { status: 409 });
      }
    }
  }

  let input: ShelterPaymentConfigInput;

  if (validated.tier === 'manual') {
    input = {
      tier: 'manual',
      iban: validated.iban,
      mbWayPhone: validated.mbWayPhone,
      activeProvider: null,
      eupagoApiKeyEncrypted: null,
      eupagoWebhookSecretEncrypted: null,
      ifthenpayAntiPhishingKey: null,
    };
  } else if (validated.activeProvider === 'eupago') {
    if (!encryptionSecret) {
      return jsonResponse({ status: 'encryption_not_configured' }, { status: 503 });
    }
    const [eupagoApiKeyEncrypted, eupagoWebhookSecretEncrypted] = await Promise.all([
      encryptCredential(validated.eupagoApiKey, encryptionSecret),
      encryptCredential(validated.eupagoWebhookSecret, encryptionSecret),
    ]);
    input = {
      tier: 'automated',
      activeProvider: 'eupago',
      iban: null,
      mbWayPhone: null,
      eupagoApiKeyEncrypted,
      eupagoWebhookSecretEncrypted,
      ifthenpayAntiPhishingKey: null,
    };
  } else {
    input = {
      tier: 'automated',
      activeProvider: 'ifthenpay',
      iban: null,
      mbWayPhone: null,
      eupagoApiKeyEncrypted: null,
      eupagoWebhookSecretEncrypted: null,
      ifthenpayAntiPhishingKey: validated.ifthenpayAntiPhishingKey,
    };
  }

  await repository.savePaymentConfig(shelterId, input);

  return jsonResponse(
    {
      status: 'payment_config_saved',
      tier: input.tier,
      activeProvider: input.activeProvider,
      iban: input.tier === 'manual' ? input.iban : null,
      mbWayPhone: input.tier === 'manual' ? input.mbWayPhone : null,
    },
    { status: 200 },
  );
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

export const matchWorkerShelterPaymentConfigId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  if (parts.length === 2 && parts[0] && parts[1] === 'payment-config') {
    return parts[0];
  }
  return null;
};
