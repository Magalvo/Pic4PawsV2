import type { PetStatusHistoryClient, PetStatusHistoryEvent, LoadPetStatusHistoryClientFailureStatus } from '@pic4paws/client';

export type MobilePetStatusHistoryUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
};

export const mobilePetStatusHistoryUiContent: MobilePetStatusHistoryUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Histórico de estados',
  description: 'Consulta o registo de transições de estado do animal.',
  loadingMessage: 'A carregar histórico…',
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobilePetStatusHistoryIdleState = { state: 'idle' };

export type MobilePetStatusHistoryLoadingState = { state: 'loading' };

export type MobilePetStatusHistoryLoadedState = {
  state: 'loaded';
  petId: string;
  events: PetStatusHistoryEvent[];
};

export type MobilePetStatusHistoryForbiddenState = {
  state: 'forbidden';
};

export type MobilePetStatusHistoryFailedState = {
  state: 'failed';
  status: LoadPetStatusHistoryClientFailureStatus;
  reasons: string[];
};

export type MobilePetStatusHistoryState =
  | MobilePetStatusHistoryIdleState
  | MobilePetStatusHistoryLoadingState
  | MobilePetStatusHistoryLoadedState
  | MobilePetStatusHistoryForbiddenState
  | MobilePetStatusHistoryFailedState;

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

export const createMobilePetStatusHistoryUi = ({
  petStatusHistoryClient,
}: {
  petStatusHistoryClient: Pick<PetStatusHistoryClient, 'loadStatusHistory'>;
}) => ({
  getInitialState: (): MobilePetStatusHistoryIdleState => ({ state: 'idle' }),

  getLoadingState: (): MobilePetStatusHistoryLoadingState => ({ state: 'loading' }),

  loadHistory: async (
    petId: string,
  ): Promise<
    MobilePetStatusHistoryLoadedState | MobilePetStatusHistoryForbiddenState | MobilePetStatusHistoryFailedState
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
