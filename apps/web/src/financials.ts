import type {
  FinancialsClient,
  FinancialsClientSummary,
  LoadFinancialsClientFailureStatus,
} from '@pic4paws/client';

export type WebFinancialsDashboardUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
};

export const webFinancialsDashboardUiContent: WebFinancialsDashboardUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Resumo financeiro',
  description: 'Consulta os donativos e apadrinhamentos do abrigo.',
  loadingMessage: 'A carregar resumo financeiro…',
};

export type WebFinancialsDashboardIdleState = {
  state: 'idle';
};

export type WebFinancialsDashboardLoadingState = {
  state: 'loading';
};

export type WebFinancialsDashboardLoadedState = {
  state: 'loaded';
  summary: FinancialsClientSummary;
};

export type WebFinancialsDashboardForbiddenState = {
  state: 'forbidden';
  message: string;
};

export type WebFinancialsDashboardFailedState = {
  state: 'failed';
  status: LoadFinancialsClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebFinancialsDashboardState =
  | WebFinancialsDashboardIdleState
  | WebFinancialsDashboardLoadingState
  | WebFinancialsDashboardLoadedState
  | WebFinancialsDashboardForbiddenState
  | WebFinancialsDashboardFailedState;

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

export const createWebFinancialsDashboardUi = ({
  financialsClient,
}: {
  financialsClient: Pick<FinancialsClient, 'loadFinancials'>;
}) => ({
  getInitialState: (): WebFinancialsDashboardIdleState => ({ state: 'idle' }),

  loadFinancials: async (
    shelterId: string,
  ): Promise<
    | WebFinancialsDashboardLoadedState
    | WebFinancialsDashboardForbiddenState
    | WebFinancialsDashboardFailedState
  > => {
    const result = await financialsClient.loadFinancials(shelterId);

    if (result.ok) {
      return { state: 'loaded', summary: result.summary };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        message: 'Não tens permissão para ver os dados financeiros deste abrigo.',
      };
    }

    return {
      state: 'failed',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
