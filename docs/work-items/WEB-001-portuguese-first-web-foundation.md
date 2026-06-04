# Work-Item: WEB-001-Portuguese-First Web Foundation

## 1. Context & Problem

The approved architecture uses Next.js for the public web, shelter dashboard and admin dashboard. The current web shell is a placeholder with mojibake Portuguese text and a dashboard CTA before dashboard features have their own specs. Before building product flows, the web app needs a clean Portuguese-first foundation screen aligned with the approved domain/config contracts.

## 2. Acceptance Criteria

- [x] The public web foundation content is PT-PT and contains no mojibake replacement text.
- [x] The first screen explains the approved platform scope without implementing product flows.
- [x] The page avoids links to unimplemented dashboard or adoption routes.
- [x] The page shows foundation readiness from existing contracts: database/RLS, auth, pet lifecycle, payments, media and workers.
- [x] The Next.js metadata uses valid PT-PT copy.
- [x] Tests fail before implementation and pass after the web foundation is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement dashboards.
- Do not implement adoption application UI.
- Do not implement donation checkout UI.
- Do not connect Supabase or Cloudflare services.

## 4. Completion Notes

- Implemented a Portuguese-first foundation screen in the Next.js web app.
- Added typed foundation content so copy, CTAs and readiness items can be tested outside React rendering.
- Confirmed the rendered home page returns HTTP 200, includes clean UTF-8 PT-PT copy, exposes foundation readiness and has no links to unimplemented dashboard/adoption routes.
