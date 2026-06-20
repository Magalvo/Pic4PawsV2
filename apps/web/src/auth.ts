type SignInWithPasswordResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

type ResetPasswordForEmailResult = {
  error: { message: string } | null;
};

type ExchangeCodeForSessionResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

type UpdateUserResult = {
  error: { message: string } | null;
};

export type SupabaseBrowserAuthClientLike = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<SignInWithPasswordResult>;
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<ResetPasswordForEmailResult>;
    exchangeCodeForSession: (code: string) => Promise<ExchangeCodeForSessionResult>;
    updateUser: (attrs: { password: string }) => Promise<UpdateUserResult>;
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

export type WebPasswordResetRequestViewModel =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'email_sent'; title: string; message: string }
  | { state: 'failed'; title: string; message: string; canRetry: true };

export type WebPasswordConfirmViewModel =
  | { state: 'idle' }
  | { state: 'updating' }
  | { state: 'updated'; title: string; message: string }
  | { state: 'invalid_link'; title: string; message: string }
  | { state: 'failed'; title: string; message: string; canRetry: true };

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

  requestPasswordReset: async (
    email: string,
    redirectTo: string,
  ): Promise<WebPasswordResetRequestViewModel> => {
    const result = await authClient.auth.resetPasswordForEmail(email, { redirectTo });

    if (result.error) {
      return {
        state: 'failed',
        title: 'Erro ao enviar email',
        message: 'Não foi possível enviar o email de recuperação. Tenta de novo mais tarde.',
        canRetry: true,
      };
    }

    return {
      state: 'email_sent',
      title: 'Email enviado',
      message:
        'Se o email estiver registado, receberás um link de recuperação em breve. Verifica também a pasta de spam.',
    };
  },

  exchangeResetCode: async (code: string): Promise<WebPasswordConfirmViewModel> => {
    const result = await authClient.auth.exchangeCodeForSession(code);

    if (result.error || !result.data?.session) {
      return {
        state: 'invalid_link',
        title: 'Link inválido',
        message: 'O link de recuperação é inválido ou já expirou. Pede um novo.',
      };
    }

    return { state: 'idle' };
  },

  updatePassword: async (newPassword: string): Promise<WebPasswordConfirmViewModel> => {
    const result = await authClient.auth.updateUser({ password: newPassword });

    if (result.error) {
      return {
        state: 'failed',
        title: 'Erro ao atualizar',
        message: 'Não foi possível atualizar a palavra-passe. Verifica os requisitos e tenta de novo.',
        canRetry: true,
      };
    }

    return {
      state: 'updated',
      title: 'Palavra-passe atualizada',
      message: 'A tua palavra-passe foi atualizada com sucesso. Podes iniciar sessão.',
    };
  },
});
