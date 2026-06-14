import { describe, it, expect, afterEach } from 'vitest';

describe('web env wiring', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_WORKER_URL;
  });

  it('workerUrl() returns NEXT_PUBLIC_WORKER_URL when set', async () => {
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.test.example.com';
    const { workerUrl } = await import('../../apps/web/src/env');
    expect(workerUrl()).toBe('https://worker.test.example.com');
  });

  it('workerUrl() throws when NEXT_PUBLIC_WORKER_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_WORKER_URL;
    const { workerUrl } = await import('../../apps/web/src/env');
    expect(() => workerUrl()).toThrow('NEXT_PUBLIC_WORKER_URL is not set');
  });
});
