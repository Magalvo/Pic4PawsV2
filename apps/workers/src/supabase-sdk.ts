import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type {
  WorkerRequestDependencies,
  WorkerSupabaseClientFactory,
  WorkerSupabaseClientLike,
} from './dependencies';

export type SupabaseSdkClientOptions = {
  auth: {
    persistSession: false;
    autoRefreshToken: false;
    detectSessionInUrl: false;
  };
  global: {
    headers: {
      'X-Client-Info': string;
    };
  };
};

export type SupabaseSdkCreateClient = (
  supabaseUrl: string,
  serviceRoleKey: string,
  options: SupabaseSdkClientOptions,
) => WorkerSupabaseClientLike;

export type CreateSupabaseSdkClientFactoryInput = {
  createClient?: SupabaseSdkCreateClient;
  clientInfo?: string;
};

export class SupabaseSdkClientFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSdkClientFactoryError';
  }
}

const defaultClientInfo = 'pic4paws-workers';
const sdkFailureMessage = 'Failed to create Supabase SDK client';
const defaultCreateClient = createSupabaseClient as unknown as SupabaseSdkCreateClient;

const createServerSafeSupabaseOptions = (clientInfo: string): SupabaseSdkClientOptions => ({
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': clientInfo,
    },
  },
});

export const createSupabaseSdkClientFactory = ({
  createClient = defaultCreateClient,
  clientInfo = defaultClientInfo,
}: CreateSupabaseSdkClientFactoryInput = {}): WorkerSupabaseClientFactory => {
  const options = createServerSafeSupabaseOptions(clientInfo);

  return ({ supabaseUrl, serviceRoleKey }) => {
    try {
      return createClient(supabaseUrl, serviceRoleKey, options);
    } catch {
      throw new SupabaseSdkClientFactoryError(sdkFailureMessage);
    }
  };
};

export const createSupabaseSdkWorkerDependencies = (
  input: CreateSupabaseSdkClientFactoryInput = {},
): WorkerRequestDependencies => ({
  supabaseClientFactory: createSupabaseSdkClientFactory(input),
});
