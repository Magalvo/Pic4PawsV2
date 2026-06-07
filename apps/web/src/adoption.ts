import type {
  AdoptionApplicationClient,
  AdoptionApplicationClientFailureStatus,
  AdoptionApplicationClientInput,
} from '@pic4paws/client';

export type WebAdoptionUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webAdoptionUiContent: WebAdoptionUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Candidatura à adoção',
  description: 'Submete uma candidatura para adotar um animal.',
  states: [
    {
      state: 'idle',
      title: 'Candidatura à adoção',
      message: 'Preenche o formulário para te candidatares à adoção.',
    },
    {
      state: 'submitting',
      title: 'A enviar...',
      message: 'A enviar a tua candidatura.',
    },
    {
      state: 'submitted',
      title: 'Candidatura enviada!',
      message:
        'A tua candidatura foi enviada com sucesso. O abrigo entrará em contacto em breve.',
    },
    {
      state: 'pet_not_found',
      title: 'Animal não disponível',
      message: 'O animal que tentaste adotar já não está disponível.',
    },
    {
      state: 'failed',
      title: 'Não foi possível enviar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebAdoptionIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebAdoptionSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type WebAdoptionSubmittedState = {
  state: 'submitted';
  title: string;
  message: string;
  applicationId: string;
  submittedAt: string;
};

export type WebAdoptionPetNotFoundState = {
  state: 'pet_not_found';
  title: string;
  message: string;
};

export type WebAdoptionFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: AdoptionApplicationClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebAdoptionResultViewModel =
  | WebAdoptionIdleState
  | WebAdoptionSubmittingState
  | WebAdoptionSubmittedState
  | WebAdoptionPetNotFoundState
  | WebAdoptionFailedState;

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

export const createWebAdoptionUi = ({
  adoptionApplicationClient,
}: {
  adoptionApplicationClient: Pick<AdoptionApplicationClient, 'submitApplication'>;
}) => ({
  getInitialState: (): WebAdoptionIdleState => ({
    state: 'idle',
    title: 'Candidatura à adoção',
    message: 'Preenche o formulário para te candidatares à adoção.',
    primaryAction: 'Candidatar',
  }),

  submitApplication: async (
    input: AdoptionApplicationClientInput,
  ): Promise<WebAdoptionSubmittedState | WebAdoptionPetNotFoundState | WebAdoptionFailedState> => {
    const result = await adoptionApplicationClient.submitApplication(input);

    if (result.ok) {
      return {
        state: 'submitted',
        title: 'Candidatura enviada!',
        message:
          'A tua candidatura foi enviada com sucesso. O abrigo entrará em contacto em breve.',
        applicationId: result.applicationId,
        submittedAt: result.submittedAt,
      };
    }

    if (result.status === 'pet_not_found') {
      return {
        state: 'pet_not_found',
        title: 'Animal não disponível',
        message: 'O animal que tentaste adotar já não está disponível.',
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível enviar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
