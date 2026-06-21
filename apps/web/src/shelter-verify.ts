import type {
  ShelterVerificationClient,
  ShelterVerificationTargetStatus,
  UpdateVerificationClientFailureStatus,
} from '@pic4paws/client';

export type WebShelterVerifyUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterVerifyUiContent: WebShelterVerifyUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Verificação do abrigo',
  description: 'Submete o teu abrigo para revisão ou gere o estado de verificação.',
  states: [
    { state: 'idle', title: 'Verificação do abrigo', message: 'Escolhe a ação que pretendes realizar.' },
    { state: 'updated', title: 'Estado atualizado', message: 'O estado de verificação foi atualizado com sucesso.' },
    { state: 'failed', title: 'Não foi possível atualizar', message: 'Ocorreu um erro ao atualizar o estado de verificação.' },
  ],
};

export type WebShelterVerifyIdleState = {
  state: 'idle';
  title: string;
  description: string;
};

export type WebShelterVerifyUpdatedState = {
  state: 'updated';
  title: string;
  message: string;
  shelterId: string;
  verificationStatus: ShelterVerificationTargetStatus;
};

export type WebShelterVerifyFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: UpdateVerificationClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterVerifyState =
  | WebShelterVerifyIdleState
  | WebShelterVerifyUpdatedState
  | WebShelterVerifyFailedState;

const unsafeReasonMarkers = [
  'service-role',
  'service_role',
  'bearer ',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter((r) => {
    const normalized = r.toLowerCase();
    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });
  return safe.length > 0 ? safe : [fallback];
};

const SUCCESS_CONTENT: Record<ShelterVerificationTargetStatus, { title: string; message: string }> = {
  pending_review: {
    title: 'Submetido para revisão',
    message: 'O abrigo foi submetido para revisão. Aguarda a análise da equipa Pic4Paws.',
  },
  verified: {
    title: 'Abrigo verificado',
    message: 'O abrigo foi verificado com sucesso e pode agora publicar animais.',
  },
  rejected: {
    title: 'Abrigo rejeitado',
    message: 'O pedido de verificação foi rejeitado.',
  },
  suspended: {
    title: 'Abrigo suspenso',
    message: 'O abrigo foi suspenso e deixou de poder publicar animais.',
  },
};

export const createWebShelterVerifyUi = ({
  shelterVerificationClient,
}: {
  shelterVerificationClient: Pick<ShelterVerificationClient, 'updateVerificationStatus'>;
}) => ({
  getInitialState: (): WebShelterVerifyIdleState => ({
    state: 'idle',
    title: 'Verificação do abrigo',
    description: 'Submete o teu abrigo para revisão ou gere o estado de verificação.',
  }),

  updateVerificationStatus: async (
    shelterId: string,
    targetStatus: ShelterVerificationTargetStatus,
  ): Promise<WebShelterVerifyUpdatedState | WebShelterVerifyFailedState> => {
    const result = await shelterVerificationClient.updateVerificationStatus(shelterId, targetStatus);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'failed',
          title: 'Sem permissão',
          message: 'Não tens permissão para efetuar esta ação.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'invalid_transition') {
        return {
          state: 'failed',
          title: 'Transição inválida',
          message: 'O abrigo não pode passar para este estado a partir do estado atual.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'shelter_not_found') {
        return {
          state: 'failed',
          title: 'Abrigo não encontrado',
          message: 'O abrigo indicado não existe.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'unauthenticated') {
        return {
          state: 'failed',
          title: 'Sessão expirada',
          message: 'A tua sessão expirou. Inicia sessão de novo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível atualizar',
        message: 'Ocorreu um erro inesperado. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    const { title, message } = SUCCESS_CONTENT[result.verificationStatus];

    return {
      state: 'updated',
      title,
      message,
      shelterId: result.shelterId,
      verificationStatus: result.verificationStatus,
    };
  },
});
