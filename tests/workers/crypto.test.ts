import { describe, expect, it } from 'vitest';
import { decryptCredential, encryptCredential } from '../../apps/workers/src/crypto';

// 64 lowercase hex chars = 32 bytes of 0xAA — valid AES-256-GCM key
const SECRET_HEX_64 = 'a'.repeat(64);
// Different key for wrong-key test
const OTHER_HEX_64 = 'b'.repeat(64);

describe('encryptCredential / decryptCredential', () => {
  it('round-trip recovers the original plaintext', async () => {
    const plain = 'my-secret-api-key';
    const encrypted = await encryptCredential(plain, SECRET_HEX_64);
    const recovered = await decryptCredential(encrypted, SECRET_HEX_64);
    expect(recovered).toBe(plain);
  });

  it('encrypted output is in iv:ciphertext hex format', async () => {
    const encrypted = await encryptCredential('test', SECRET_HEX_64);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('different encryptions of the same value differ (random IV)', async () => {
    const a = await encryptCredential('same-value', SECRET_HEX_64);
    const b = await encryptCredential('same-value', SECRET_HEX_64);
    expect(a).not.toBe(b);
  });

  it('decryption with wrong secret throws', async () => {
    const encrypted = await encryptCredential('secret', SECRET_HEX_64);
    await expect(decryptCredential(encrypted, OTHER_HEX_64)).rejects.toThrow();
  });

  it('tampered ciphertext throws on decryption', async () => {
    const encrypted = await encryptCredential('secret', SECRET_HEX_64);
    const tampered = encrypted.slice(0, -4) + '0000';
    await expect(decryptCredential(tampered, SECRET_HEX_64)).rejects.toThrow();
  });
});
