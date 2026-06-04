# Work-Spec: Implementation Plan for WEB-001

## 1. Target Files

- `docs/work-items/WEB-001-portuguese-first-web-foundation.md`
- `docs/work-specs/WEB-001-portuguese-first-web-foundation.md`
- `apps/web/src/foundation.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/styles.css`
- `tests/web/foundation-content.test.ts`

## 2. Proposed Technical Approach

Move foundation page copy and status metadata into `apps/web/src/foundation.ts` so it is testable without rendering Next.js. The page should consume that contract and render a single usable foundation screen with clear status bands. It should avoid feature-like navigation and keep CTAs disabled/non-navigational until specs exist.

## 3. Testing Strategy

- Initial failing test: assert PT-PT text, absence of mojibake, no unimplemented route hrefs, and readiness status labels.
- Expected input data: imported foundation content contract.
- Expected output/behavior: deterministic content object used by the page.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Do not add live service calls.
- Do not create misleading dashboard/adoption/donation navigation.
- Keep content compact and foundation-oriented.
- Keep UI grounded in approved design tokens.

