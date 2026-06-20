type SignInWithPasswordResult = {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
};

type ResetPasswordForEmailResult = {
  error: { message: string } | null;
};

export type SupabaseMobileAuthClientLike = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<SignInWithPasswordResult>;
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<ResetPasswordForEmailResult>;
  };
};

export type MobileAuthSignedInState = {
  state: 'signed_in';
  title: string;
  message: string;
  accessToken: string;
};

export type MobileAuthFailedState = {
  state: 'failed';
  title: string;
  message: string;
  canRetry: true;
};

export type MobileAuthSignInResultViewModel =
  | MobileAuthSignedInState
  | MobileAuthFailedState;

export type MobilePasswordResetRequestViewModel =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'email_sent'; title: string; message: string }
  | { state: 'failed'; title: string; message: string; canRetry: true };

export const createMobileAuthUi = ({
  authClient,
}: {
  authClient: SupabaseMobileAuthClientLike;
}) => ({
  signIn: async (
    email: string,
    password: string,
  ): Promise<MobileAuthSignInResultViewModel> => {
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
  ): Promise<MobilePasswordResetRequestViewModel> => {
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
});
