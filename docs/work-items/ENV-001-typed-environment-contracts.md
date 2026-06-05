# Work-Item: ENV-001-Typed Environment Contracts

## 1. Context & Problem

The approved architecture depends on Supabase, Cloudflare Workers, Cloudflare R2 and Portuguese payment providers. The project must never hardcode secrets, and runtime configuration must be validated at external boundaries before workers or web routes use it. The current config package only exposes static app constants.

This task establishes typed environment contracts and safe redaction helpers without storing or committing real secrets.

## 2. Acceptance Criteria

- [x] Environment parsing validates Supabase, Cloudflare R2, Worker and payment provider settings.
- [x] Required secrets are read only from provided environment records.
- [x] Missing or invalid environment values return structured errors.
- [x] Provider-specific secrets are required for the configured primary payment provider.
- [x] Redaction helpers mask secret values for logs and diagnostics.
- [x] Tests fail before implementation and pass after typed environment contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not add real `.env` files.
- Do not commit API keys, tokens or secrets.
- Do not connect to Supabase, R2 or payment providers.
- Do not implement deployment-specific secret provisioning.

## 4. Completion Notes

- Added Zod-based environment parsing for Supabase, Cloudflare R2, Workers and payment providers.
- Added provider-specific secret requirements for Eupago, Ifthenpay and Stripe.
- Added redaction helpers for safe logs and diagnostics.
- No `.env` file or real secret was added.
- Full validation passed with Node `22.22.3`.
