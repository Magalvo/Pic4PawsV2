import type { PetStatusHistoryClient, PetStatusHistoryEvent, LoadPetStatusHistoryClientFailureStatus } from '@pic4paws/client';

export type WebPetStatusHistoryUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
};

export const webPetStatusHistoryUiContent: WebPetStatusHistoryUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Histórico de estados',
  description: 'Consulta o registo de transições de estado do animal.',
  loadingMessage: 'A carregar histórico…',
};

// ─── State types ──────────────────────────────────────────────────────────────

export type WebPetStatusHistoryIdleState = { state: 'idle' };

export type WebPetStatusHistoryLoadingState = { state: 'loading' };

export type WebPetStatusHistoryLoadedState = {
  state: 'loaded';
  petId: string;
  events: PetStatusHistoryEvent[];
};

export type WebPetStatusHistoryForbiddenState = {
  state: 'forbidden';
};

export type WebPetStatusHistoryFailedState = {
  state: 'failed';
  status: LoadPetStatusHistoryClientFailureStatus;
  reasons: string[];
};

export type WebPetStatusHistoryState =
  | WebPetStatusHistoryIdleState
  | WebPetStatusHistoryLoadingState
  | WebPetStatusHistoryLoadedState
  | WebPetStatusHistoryForbiddenState
  | WebPetStatusHistoryFailedState;

// ─── Credential sanitization ──────────────────────────────────────────────────

const unsafeReasonMarkers = [
  'signedurl',
  'temporary=',
  'service-role',
  'service_role',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
  'user-access-token',
  'bearer ',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter((r) => {
    const normalized = r.toLowerCase();
    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });
  return safe.length > 0 ? safe : [fallback];
};

// ─── UI factory ───────────────────────────────────────────────────────────────

export const createWebPetStatusHistoryUi = ({
  petStatusHistoryClient,
}: {
  petStatusHistoryClient: Pick<PetStatusHistoryClient, 'loadStatusHistory'>;
}) => ({
  getInitialState: (): WebPetStatusHistoryIdleState => ({ state: 'idle' }),

  getLoadingState: (): WebPetStatusHistoryLoadingState => ({ state: 'loading' }),

  loadHistory: async (
    petId: string,
  ): Promise<
    WebPetStatusHistoryLoadedState | WebPetStatusHistoryForbiddenState | WebPetStatusHistoryFailedState
  > => {
    const result = await petStatusHistoryClient.loadStatusHistory(petId);

    if (result.ok) {
      return { state: 'loaded', petId: result.petId, events: result.events };
    }

    if (result.status === 'forbidden') {
      return { state: 'forbidden' };
    }

    return {
      state: 'failed',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
    };
  },
});
