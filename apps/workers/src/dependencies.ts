import type { EnvironmentConfig } from '@pic4paws/config';
import {
  createSupabaseAuthAdapter,
  type SupabaseAuthClientLike,
  type SupabaseAuthTableQueryLike,
} from './auth-supabase';
import { type MediaUploadSigner } from './media-upload';
import {
  createSupabasePetRepositories,
  type SupabaseClientLike,
  type SupabaseTableQueryLike,
} from './pet-supabase';
import type {
  PetDraftRepository,
  PetPublishRepository,
  WorkerPetDraftAuthenticator,
} from './pet-drafts';

export type WorkerSupabaseTableQueryLike = SupabaseAuthTableQueryLike & SupabaseTableQueryLike;

export type WorkerSupabaseClientLike = Omit<SupabaseAuthClientLike, 'from'> &
  Omit<SupabaseClientLike, 'from'> & {
    from: (table: string) => WorkerSupabaseTableQueryLike;
  };

export type WorkerSupabaseClientFactoryInput = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

export type WorkerSupabaseClientFactory = (
  input: WorkerSupabaseClientFactoryInput,
) => WorkerSupabaseClientLike;

export type WorkerRequestDependencies = {
  mediaUploadSigner?: MediaUploadSigner;
  petDraftAuthenticator?: WorkerPetDraftAuthenticator;
  petDraftRepository?: PetDraftRepository;
  petPublishRepository?: PetPublishRepository;
  supabaseClientFactory?: WorkerSupabaseClientFactory;
  now?: () => string;
};

export type CreateWorkerSupabaseDependenciesInput = {
  config: EnvironmentConfig;
  supabaseClientFactory: WorkerSupabaseClientFactory;
  mediaUploadSigner?: MediaUploadSigner;
  now?: () => string;
};

export type ResolveWorkerRequestDependenciesInput = {
  config: EnvironmentConfig;
  dependencies?: WorkerRequestDependencies;
};

export class WorkerSupabaseWiringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerSupabaseWiringError';
  }
}

const wiringFailureMessage = 'Failed to configure Supabase worker dependencies';

export const createWorkerSupabaseDependencies = ({
  config,
  supabaseClientFactory,
  mediaUploadSigner,
  now,
}: CreateWorkerSupabaseDependenciesInput): WorkerRequestDependencies => {
  try {
    const client = supabaseClientFactory({
      supabaseUrl: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
    });
    const petRepositories = createSupabasePetRepositories({ client });

    return {
      mediaUploadSigner,
      petDraftAuthenticator: createSupabaseAuthAdapter({ client }),
      petDraftRepository: petRepositories.petDraftRepository,
      petPublishRepository: petRepositories.petPublishRepository,
      now,
    };
  } catch {
    throw new WorkerSupabaseWiringError(wiringFailureMessage);
  }
};

export const resolveWorkerRequestDependencies = ({
  config,
  dependencies = {},
}: ResolveWorkerRequestDependenciesInput): WorkerRequestDependencies => {
  if (!dependencies.supabaseClientFactory) {
    return dependencies;
  }

  if (
    dependencies.petDraftAuthenticator &&
    dependencies.petDraftRepository &&
    dependencies.petPublishRepository
  ) {
    return dependencies;
  }

  const supabaseDependencies = createWorkerSupabaseDependencies({
    config,
    supabaseClientFactory: dependencies.supabaseClientFactory,
    mediaUploadSigner: dependencies.mediaUploadSigner,
    now: dependencies.now,
  });

  return {
    ...dependencies,
    petDraftAuthenticator:
      dependencies.petDraftAuthenticator ?? supabaseDependencies.petDraftAuthenticator,
    petDraftRepository: dependencies.petDraftRepository ?? supabaseDependencies.petDraftRepository,
    petPublishRepository:
      dependencies.petPublishRepository ?? supabaseDependencies.petPublishRepository,
  };
};
