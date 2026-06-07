import { z } from 'zod';

const requiredSecret = z.string().trim().min(1, 'Required');
const optionalSecret = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .default('');

const environmentSchema = z
  .object({
    APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
    PUBLIC_APP_ORIGIN: z.string().url(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: requiredSecret,
    SUPABASE_SERVICE_ROLE_KEY: requiredSecret,
    CLOUDFLARE_ACCOUNT_ID: requiredSecret,
    R2_PUBLIC_BUCKET: requiredSecret,
    R2_PRIVATE_BUCKET: requiredSecret,
    R2_ACCESS_KEY_ID: requiredSecret,
    R2_SECRET_ACCESS_KEY: requiredSecret,
    WORKER_PAYMENT_WEBHOOK_PATH: z.string().startsWith('/').default('/webhooks/payments'),
    WORKER_MEDIA_UPLOAD_PATH: z.string().startsWith('/').default('/uploads/media'),
    WORKER_PET_DRAFTS_PATH: z.string().startsWith('/').default('/pets/drafts'),
    WORKER_PET_FEED_PATH: z.string().startsWith('/').default('/pets'),
    WORKER_SHELTER_PATH: z.string().startsWith('/').default('/shelters'),
    PAYMENT_PRIMARY_PROVIDER: z.enum(['eupago', 'ifthenpay', 'stripe']),
    EUPAGO_API_KEY: optionalSecret,
    EUPAGO_WEBHOOK_SECRET: optionalSecret,
    IFTHENPAY_API_KEY: optionalSecret,
    IFTHENPAY_WEBHOOK_SECRET: optionalSecret,
    STRIPE_SECRET_KEY: optionalSecret,
    STRIPE_WEBHOOK_SECRET: optionalSecret,
  })
  .superRefine((env, context) => {
    const providerRequirements = {
      eupago: ['EUPAGO_API_KEY', 'EUPAGO_WEBHOOK_SECRET'],
      ifthenpay: ['IFTHENPAY_API_KEY', 'IFTHENPAY_WEBHOOK_SECRET'],
      stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    } as const;

    for (const key of providerRequirements[env.PAYMENT_PRIMARY_PROVIDER]) {
      if (!env[key]) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `Required for primary provider ${env.PAYMENT_PRIMARY_PROVIDER}`,
        });
      }
    }
  });

export type AppEnvironment = 'development' | 'preview' | 'production';
export type PrimaryPaymentProvider = 'eupago' | 'ifthenpay' | 'stripe';

export type EnvironmentConfig = {
  app: {
    environment: AppEnvironment;
    publicAppOrigin: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  cloudflare: {
    accountId: string;
    r2PublicBucket: string;
    r2PrivateBucket: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
  };
  workers: {
    paymentWebhookPath: string;
    mediaUploadPath: string;
    petDraftsPath: string;
    petFeedPath: string;
    shelterPath: string;
  };
  payments: {
    primaryProvider: PrimaryPaymentProvider;
    eupagoApiKey: string | null;
    eupagoWebhookSecret: string | null;
    ifthenpayApiKey: string | null;
    ifthenpayWebhookSecret: string | null;
    stripeSecretKey: string | null;
    stripeWebhookSecret: string | null;
  };
};

export type EnvironmentConfigError = {
  path: string;
  message: string;
};

export type ParseEnvironmentConfigResult =
  | { ok: true; config: EnvironmentConfig }
  | { ok: false; errors: EnvironmentConfigError[] };

export type EnvironmentRecord = Record<string, string | undefined>;

const pathToString = (path: PropertyKey[]): string => path.map(String).join('.');
const optionalSecretToNullable = (value: string | null | undefined): string | null =>
  value && value.length > 0 ? value : null;

export const parseEnvironmentConfig = (
  record: EnvironmentRecord,
): ParseEnvironmentConfigResult => {
  const parsed = environmentSchema.safeParse(record);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({
        path: pathToString(issue.path),
        message: issue.message,
      })),
    };
  }

  const env = parsed.data;

  return {
    ok: true,
    config: {
      app: {
        environment: env.APP_ENV,
        publicAppOrigin: env.PUBLIC_APP_ORIGIN,
      },
      supabase: {
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      cloudflare: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        r2PublicBucket: env.R2_PUBLIC_BUCKET,
        r2PrivateBucket: env.R2_PRIVATE_BUCKET,
        r2AccessKeyId: env.R2_ACCESS_KEY_ID,
        r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      workers: {
        paymentWebhookPath: env.WORKER_PAYMENT_WEBHOOK_PATH,
        mediaUploadPath: env.WORKER_MEDIA_UPLOAD_PATH,
        petDraftsPath: env.WORKER_PET_DRAFTS_PATH,
        petFeedPath: env.WORKER_PET_FEED_PATH,
        shelterPath: env.WORKER_SHELTER_PATH,
      },
      payments: {
        primaryProvider: env.PAYMENT_PRIMARY_PROVIDER,
        eupagoApiKey: optionalSecretToNullable(env.EUPAGO_API_KEY),
        eupagoWebhookSecret: optionalSecretToNullable(env.EUPAGO_WEBHOOK_SECRET),
        ifthenpayApiKey: optionalSecretToNullable(env.IFTHENPAY_API_KEY),
        ifthenpayWebhookSecret: optionalSecretToNullable(env.IFTHENPAY_WEBHOOK_SECRET),
        stripeSecretKey: optionalSecretToNullable(env.STRIPE_SECRET_KEY),
        stripeWebhookSecret: optionalSecretToNullable(env.STRIPE_WEBHOOK_SECRET),
      },
    },
  };
};

const redactSecret = (value: string | null): string | null => (value ? '[redacted]' : null);

export const redactEnvironmentConfig = (config: EnvironmentConfig): EnvironmentConfig => ({
  app: config.app,
  supabase: {
    url: config.supabase.url,
    anonKey: '[redacted]',
    serviceRoleKey: '[redacted]',
  },
  cloudflare: {
    accountId: config.cloudflare.accountId,
    r2PublicBucket: config.cloudflare.r2PublicBucket,
    r2PrivateBucket: config.cloudflare.r2PrivateBucket,
    r2AccessKeyId: '[redacted]',
    r2SecretAccessKey: '[redacted]',
  },
  workers: config.workers,
  payments: {
    primaryProvider: config.payments.primaryProvider,
    eupagoApiKey: redactSecret(config.payments.eupagoApiKey),
    eupagoWebhookSecret: redactSecret(config.payments.eupagoWebhookSecret),
    ifthenpayApiKey: redactSecret(config.payments.ifthenpayApiKey),
    ifthenpayWebhookSecret: redactSecret(config.payments.ifthenpayWebhookSecret),
    stripeSecretKey: redactSecret(config.payments.stripeSecretKey),
    stripeWebhookSecret: redactSecret(config.payments.stripeWebhookSecret),
  },
});
