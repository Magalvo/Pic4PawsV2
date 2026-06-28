---
id: PAYMENT-ENCRYPTION-KEY-001
title: Enforce 32-byte hex encryption key contract at env parse and crypto import
status: done
depends-on: EUPAGO-CONFIG-WORKER-001
pr: 288
merged: 2026-06-28
---

# Work-Item: PAYMENT-ENCRYPTION-KEY-001 — Encryption Key Contract

## 1. Context & Problem

Two independent defects allow malformed AES-256-GCM keys to reach the crypto layer silently:

1. `packages/config/src/env.ts:41` uses `optionalSecret` for `ENCRYPTION_SECRET`, which
   accepts any non-empty string. No minimum length or format is enforced at startup.

2. `apps/workers/src/crypto.ts:10` calls `secret.slice(0, 32)` to produce the raw AES key.
   `String.prototype.slice` counts JavaScript UTF-16 code units, not raw bytes. Non-ASCII
   characters each occupy 2–4 bytes when UTF-8 encoded, so a 32-character string containing
   any non-ASCII character produces fewer than 32 raw bytes and an invalid AES-256 key.

## Goal

Enforce that `ENCRYPTION_SECRET`, when set, must be exactly 64 lowercase hex characters
(representing 32 bytes). Decode the key deterministically with `fromHex` in `crypto.ts`
so the key length is always exactly 32 bytes regardless of character encoding.

## States

No ViewModel or client state changes. The fix is entirely in the Worker env parsing and
key derivation layer.

## Acceptance Criteria

- [x] `packages/config/src/env.ts`:
  - Add `encryptionSecretSchema`: absent/empty → `null`; present → must match `/^[0-9a-f]{64}$/`
  - Replace `ENCRYPTION_SECRET: optionalSecret` with `ENCRYPTION_SECRET: encryptionSecretSchema`
  - `encryptionSecret` mapping in `parseEnvironmentConfig` uses the transformed value directly
- [x] `apps/workers/src/crypto.ts`:
  - `importKey` uses `fromHex(secret)` instead of `new TextEncoder().encode(secret.slice(0, 32))`
- [x] `tests/workers/crypto.test.ts`:
  - Replace 32-char ASCII `SECRET_32` with 64-char lowercase hex `SECRET_HEX_64`
  - Wrong-key test uses a different valid 64-char hex
- [x] `tests/config/environment-contracts.test.ts`:
  - Present valid 64-hex `ENCRYPTION_SECRET` → accepted, maps to config value
  - Present short (non-64-char) value → `{ ok: false }` with format error
  - Present non-hex value → `{ ok: false }` with format error
  - Absent `ENCRYPTION_SECRET` → `encryptionSecret: null` (existing test covers this)
- [x] All four gates pass: typecheck, lint, test, build

## Affected Files

- `packages/config/src/env.ts`
- `apps/workers/src/crypto.ts`
- `tests/workers/crypto.test.ts`
- `tests/config/environment-contracts.test.ts`
