import { describe, expect, it } from 'vitest';
import { decryptCredential, encryptCredential } from '../../apps/workers/src/crypto';

const SECRET_32 = 'aaaabbbbccccddddeeeeffffgggghhhh'; // exactly 32 bytes

describe('encryptCredential / decryptCredential', () => {
  it('round-trip recovers the original plaintext', async () => {
    const plain = 'my-secret-api-key';
    const encrypted = await encryptCredential(plain, SECRET_32);
    const recovered = await decryptCredential(encrypted, SECRET_32);
    expect(recovered).toBe(plain);
  });

  it('encrypted output is in iv:ciphertext hex format', async () => {
    const encrypted = await encryptCredential('test', SECRET_32);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('different encryptions of the same value differ (random IV)', async () => {
    const a = await encryptCredential('same-value', SECRET_32);
    const b = await encryptCredential('same-value', SECRET_32);
    expect(a).not.toBe(b);
  });

  it('decryption with wrong secret throws', async () => {
    const encrypted = await encryptCredential('secret', SECRET_32);
    await expect(decryptCredential(encrypted, 'wrongwrongwrongwrongwrongwrongww')).rejects.toThrow();
  });

  it('tampered ciphertext throws on decryption', async () => {
    const encrypted = await encryptCredential('secret', SECRET_32);
    const tampered = encrypted.slice(0, -4) + '0000';
    await expect(decryptCredential(tampered, SECRET_32)).rejects.toThrow();
  });
});
