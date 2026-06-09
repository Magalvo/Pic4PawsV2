import type {
  PetArchiveClient,
  PetArchiveClientFailureStatus,
  PetRepublishClientFailureStatus,
} from '@pic4paws/client';

export type MobilePetArchiveUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobilePetArchiveUiContent: MobilePetArchiveUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Arquivar animal',
  description: 'Arquiva um animal para o remover do fluxo ativo.',
  states: [
    {
      state: 'idle',
      title: 'Arquivar animal',
      message: 'Confirma que queres arquivar este animal.',
    },
    {
      state: 'submitting',
      title: 'A processar...',
      message: 'A arquivar o animal.',
    },
    {
      state: 'archived',
      title: 'Animal arquivado!',
      message: 'O animal foi arquivado com sucesso.',
    },
    {
      state: 'published',
      title: 'Animal publicado!',
      message: 'O animal voltou a estar disponível para adoção.',
    },
    {
      state: 'failed',
      title: 'Não foi possível arquivar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobilePetArchiveIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobilePetArchiveSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type MobilePetArchiveArchivedState = {
  state: 'archived';
  title: string;
  message: string;
  petId: string;
};

export type MobilePetArchivePublishedState = {
  state: 'published';
  title: string;
  message: string;
  petId: string;
};

export type MobilePetArchiveFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: PetArchiveClientFailureStatus | PetRepublishClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobilePetArchiveResultViewModel =
  | MobilePetArchiveArchivedState
  | MobilePetArchivePublishedState
  | MobilePetArchiveFailedState;

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

export const createMobilePetArchiveUi = ({
  petArchiveClient,
}: {
  petArchiveClient: Pick<PetArchiveClient, 'archivePet' | 'republishPet'>;
}) => ({
  getInitialState: (): MobilePetArchiveIdleState => ({
    state: 'idle',
    title: 'Arquivar animal',
    message: 'Confirma que queres arquivar este animal.',
    primaryAction: 'Arquivar',
  }),

  archivePet: async (petId: string): Promise<MobilePetArchiveResultViewModel> => {
    const result = await petArchiveClient.archivePet(petId);

    if (result.ok) {
      return {
        state: 'archived',
        title: 'Animal arquivado!',
        message: 'O animal foi arquivado com sucesso.',
        petId: result.petId,
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível arquivar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },

  republishPet: async (petId: string): Promise<MobilePetArchiveResultViewModel> => {
    const result = await petArchiveClient.republishPet(petId);

    if (result.ok) {
      return {
        state: 'published',
        title: 'Animal publicado!',
        message: 'O animal voltou a estar disponível para adoção.',
        petId: result.petId,
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível publicar o animal',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
