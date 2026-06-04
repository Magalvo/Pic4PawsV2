# Work-Spec: Implementation Plan for MOBILE-001

## 1. Target Files

- `docs/work-items/MOBILE-001-portuguese-first-mobile-foundation.md`
- `docs/work-specs/MOBILE-001-portuguese-first-mobile-foundation.md`
- `apps/mobile/src/foundation.ts`
- `apps/mobile/app/index.tsx`
- `tests/mobile/foundation-content.test.ts`

## 2. Proposed Technical Approach

Move mobile foundation copy and readiness metadata into `apps/mobile/src/foundation.ts` so it is testable without rendering Expo. The `app/index.tsx` screen should consume that contract and render one compact foundation screen using React Native primitives. It should avoid route links and product-flow actions until dedicated specs exist.

## 3. Testing Strategy

- Initial failing test: assert PT-PT text, absence of mojibake, no unimplemented navigation targets, and readiness status labels.
- Expected input data: imported mobile foundation content contract.
- Expected output/behavior: deterministic content object used by the Expo screen.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Do not add live service calls.
- Do not create misleading adoption/donation/shelter navigation.
- Keep UI foundation-oriented and compact.
- Keep domain behavior testable outside React Native rendering.
