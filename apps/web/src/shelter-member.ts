import type {
  ShelterMemberClient,
  ShelterMemberClientFailureStatus,
  ShelterMemberClientRole,
  ShelterMemberClientSummary,
} from '@pic4paws/client';

export type WebShelterMemberUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterMemberUiContent: WebShelterMemberUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Membros do abrigo',
  description: 'Gere os membros do teu abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Membros do abrigo',
      message: 'Gere os membros do teu abrigo.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter a lista de membros.',
    },
    {
      state: 'loaded',
      title: 'Membros do abrigo',
      message: 'Lista de membros do abrigo.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para gerir este abrigo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
    {
      state: 'member_added',
      title: 'Membro adicionado!',
      message: 'O membro foi adicionado ao abrigo com sucesso.',
    },
    {
      state: 'member_removed',
      title: 'Membro removido!',
      message: 'O membro foi removido do abrigo.',
    },
    {
      state: 'action_failed',
      title: 'Ação não concluída',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type WebShelterMemberIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebShelterMemberLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type WebShelterMemberLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  members: ShelterMemberClientSummary[];
  total: number;
};

export type WebShelterMemberForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebShelterMemberFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: ShelterMemberClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterMemberAddedState = {
  state: 'member_added';
  title: string;
  message: string;
  memberId: string;
  userId: string;
  role: ShelterMemberClientRole;
};

export type WebShelterMemberRemovedState = {
  state: 'member_removed';
  title: string;
  message: string;
  memberId: string;
};

export type WebShelterMemberActionFailedState = {
  state: 'action_failed';
  title: string;
  message: string;
  status: ShelterMemberClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterMemberListResultViewModel =
  | WebShelterMemberLoadedState
  | WebShelterMemberForbiddenState
  | WebShelterMemberFailedState;

export type WebShelterMemberActionResultViewModel =
  | WebShelterMemberAddedState
  | WebShelterMemberRemovedState
  | WebShelterMemberActionFailedState;

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

export const createWebShelterMemberUi = ({
  shelterMemberClient,
}: {
  shelterMemberClient: Pick<
    ShelterMemberClient,
    'loadShelterMembers' | 'addShelterMember' | 'removeShelterMember'
  >;
}) => ({
  getInitialState: (): WebShelterMemberIdleState => ({
    state: 'idle',
    title: 'Membros do abrigo',
    message: 'Gere os membros do teu abrigo.',
    primaryAction: 'Ver membros',
  }),

  loadShelterMembers: async (
    shelterId: string,
  ): Promise<WebShelterMemberListResultViewModel> => {
    const result = await shelterMemberClient.loadShelterMembers(shelterId);

    if (result.ok) {
      return {
        state: 'loaded',
        title: 'Membros do abrigo',
        message: 'Lista de membros do abrigo.',
        members: result.members,
        total: result.total,
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para gerir este abrigo.',
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },

  addShelterMember: async (
    shelterId: string,
    input: { userId: string; role: ShelterMemberClientRole },
  ): Promise<WebShelterMemberAddedState | WebShelterMemberActionFailedState> => {
    const result = await shelterMemberClient.addShelterMember(shelterId, input);

    if (result.ok) {
      return {
        state: 'member_added',
        title: 'Membro adicionado!',
        message: 'O membro foi adicionado ao abrigo com sucesso.',
        memberId: result.memberId,
        userId: result.userId,
        role: result.role,
      };
    }

    return {
      state: 'action_failed',
      title: 'Ação não concluída',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },

  removeShelterMember: async (
    shelterId: string,
    memberId: string,
  ): Promise<WebShelterMemberRemovedState | WebShelterMemberActionFailedState> => {
    const result = await shelterMemberClient.removeShelterMember(shelterId, memberId);

    if (result.ok) {
      return {
        state: 'member_removed',
        title: 'Membro removido!',
        message: 'O membro foi removido do abrigo.',
        memberId: result.memberId,
      };
    }

    return {
      state: 'action_failed',
      title: 'Ação não concluída',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
