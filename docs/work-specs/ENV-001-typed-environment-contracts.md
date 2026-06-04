# Work-Spec: Implementation Plan for ENV-001

## 1. Target Files

- `docs/work-items/ENV-001-typed-environment-contracts.md`
- `docs/work-specs/ENV-001-typed-environment-contracts.md`
- `packages/config/package.json`
- `packages/config/src/env.ts`
- `packages/config/src/index.ts`
- `tests/config/environment-contracts.test.ts`

## 2. Proposed Technical Approach

Add Zod-based runtime validation in `packages/config`. Expose:

- `parseEnvironmentConfig`
- `redactEnvironmentConfig`

The parser should accept a plain record so tests, Workers and Next.js server code can pass `process.env` or Worker bindings explicitly. It should return a result union rather than throwing. Redaction should mask secret-bearing fields before logs or diagnostics.

## 3. Testing Strategy

- Initial failing test: assert valid config parsing, structured missing-value errors, payment provider specific validation, and secret redaction.
- Expected input data: in-memory environment records.
- Expected output/behavior: valid records parse into typed config; invalid records return path-based errors; redaction does not include secret values.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Keep secrets out of source code and docs.
- Do not read process globals inside the parser.
- Avoid returning raw secret values in validation errors.
- Keep provider-specific requirements explicit.

