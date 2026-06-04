# Work-Spec: Implementation Plan for WORKERS-001

## 1. Target Files

- `docs/work-items/WORKERS-001-validated-worker-boundaries.md`
- `docs/work-specs/WORKERS-001-validated-worker-boundaries.md`
- `apps/workers/src/index.ts`
- `tests/workers/worker-boundary.test.ts`

## 2. Proposed Technical Approach

Refactor `apps/workers/src/index.ts` to export a pure `handleWorkerRequest(request, env)` function and keep the default Worker export as a small adapter. The handler should use `parseEnvironmentConfig` from `@pic4paws/config` on every request boundary.

Behavior:

- invalid env: `500` with `configuration_error` and path-based errors;
- `GET /health`: `200` service status using validated config;
- payment webhook path from env: reject non-POST with `405`;
- payment webhook POST: parse JSON, reject invalid JSON with `400`;
- valid JSON: return `501 provider_adapter_not_configured`, making it explicit that no payment state has been trusted or processed yet.

## 3. Testing Strategy

- Initial failing test: assert health success, invalid env errors, payment webhook method rejection, invalid JSON rejection and provider adapter not configured response.
- Expected input data: in-memory Worker env records and Request objects.
- Expected output/behavior: deterministic JSON responses and status codes without leaking secrets.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Keep secret values out of response bodies.
- Do not process payment state without provider verification.
- Keep Worker logic testable outside Cloudflare runtime.
- Keep future provider adapters behind this boundary.

