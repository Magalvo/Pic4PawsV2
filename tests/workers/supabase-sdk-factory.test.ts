import { describe, expect, it } from 'vitest';
import {
  createSupabaseSdkClientFactory,
  createSupabaseSdkWorkerDependencies,
  SupabaseSdkClientFactoryError,
  type SupabaseSdkClientOptions,
  type WorkerSupabaseClientLike,
} from '../../apps/workers/src/index';

const fakeClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => {
    throw new Error('not used by sdk factory tests');
  },
} as WorkerSupabaseClientLike;

describe('Supabase SDK Worker client factory', () => {
  it('creates Worker Supabase clients with server-safe SDK options', () => {
    const calls: Array<{
      supabaseUrl: string;
      serviceRoleKey: string;
      options: SupabaseSdkClientOptions;
    }> = [];
    const factory = createSupabaseSdkClientFactory({
      createClient: (supabaseUrl, serviceRoleKey, options) => {
        calls.push({ supabaseUrl, serviceRoleKey, options });

        return fakeClient;
      },
    });

    expect(
      factory({
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      }),
    ).toBe(fakeClient);
    expect(calls).toEqual([
      {
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
        options: {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: {
              'X-Client-Info': 'pic4paws-workers',
            },
          },
        },
      },
    ]);
  });

  it('creates Worker request dependencies backed by the SDK factory', () => {
    const createdInputs: Array<{ supabaseUrl: string; serviceRoleKey: string }> = [];
    const dependencies = createSupabaseSdkWorkerDependencies({
      createClient: (supabaseUrl, serviceRoleKey) => {
        createdInputs.push({ supabaseUrl, serviceRoleKey });

        return fakeClient;
      },
    });

    expect(dependencies.supabaseClientFactory).toBeDefined();
    expect(
      dependencies.supabaseClientFactory?.({
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      }),
    ).toBe(fakeClient);
    expect(createdInputs).toEqual([
      {
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      },
    ]);
  });

  it('throws sanitized errors without leaking SDK provider payloads or secrets', () => {
    const factory = createSupabaseSdkClientFactory({
      createClient: () => {
        throw new Error('service-role-secret Bearer test-token provider payload');
      },
    });
    const createClient = () =>
      factory({
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      });

    expect(createClient).toThrowError(
      new SupabaseSdkClientFactoryError('Failed to create Supabase SDK client'),
    );
    expect(createClient).not.toThrow(/service-role-secret|test-token|provider payload/);
  });
});
