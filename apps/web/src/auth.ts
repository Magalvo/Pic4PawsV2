type SignInWithPasswordResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

export type SupabaseBrowserAuthClientLike = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<SignInWithPasswordResult>;
  };
};

export type WebAuthSignedInState = {
  state: 'signed_in';
  title: string;
  message: string;
  accessToken: string;
};

export type WebAuthFailedState = {
  state: 'failed';
  title: string;
  message: string;
  canRetry: true;
};

export type WebAuthSignInResultViewModel = WebAuthSignedInState | WebAuthFailedState;

export const createWebAuthUi = ({
  authClient,
}: {
  authClient: SupabaseBrowserAuthClientLike;
}) => ({
  signIn: async (email: string, password: string): Promise<WebAuthSignInResultViewModel> => {
    const result = await authClient.auth.signInWithPassword({ email, password });

    if (result.error || !result.data?.session) {
      return {
        state: 'failed',
        title: 'Erro ao entrar',
        message: 'Email ou palavra-passe incorretos. Verifica os dados e tenta de novo.',
        canRetry: true,
      };
    }

    return {
      state: 'signed_in',
      title: 'Bem-vindo!',
      message: 'Sessão iniciada com sucesso.',
      accessToken: result.data.session.access_token,
    };
  },
});
