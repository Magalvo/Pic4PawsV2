const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string): Uint8Array =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));

const importKey = (secret: string): Promise<CryptoKey> => {
  const raw = new TextEncoder().encode(secret.slice(0, 32));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

export const encryptCredential = async (plain: string, secret: string): Promise<string> => {
  const key = await importKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return `${toHex(iv)}:${toHex(new Uint8Array(ciphertext))}`;
};

export const decryptCredential = async (encrypted: string, secret: string): Promise<string> => {
  const sep = encrypted.indexOf(':');
  const iv = fromHex(encrypted.slice(0, sep));
  const ciphertext = fromHex(encrypted.slice(sep + 1));
  const key = await importKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plaintext);
};
