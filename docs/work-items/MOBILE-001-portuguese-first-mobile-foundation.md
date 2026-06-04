# Work-Item: MOBILE-001-Portuguese-First Mobile Foundation

## 1. Context & Problem

The approved architecture uses Expo/React Native for the mobile app. The current mobile shell is a placeholder with incomplete Portuguese copy and product-flow wording before mobile journeys have their own specs. Before implementing adoption, sponsorship or shelter workflows, the mobile app needs a Portuguese-first foundation screen aligned with the approved contracts.

## 2. Acceptance Criteria

- [x] The mobile foundation content is PT-PT and contains no mojibake replacement text.
- [x] The first screen explains the approved platform scope without implementing product flows.
- [x] The screen avoids navigation targets for unimplemented adoption, donation, shelter or dashboard routes.
- [x] The screen shows foundation readiness from existing contracts: database/RLS, auth, pet lifecycle, payments, media and workers.
- [x] The mobile screen is backed by a typed content contract testable outside React Native rendering.
- [x] Tests fail before implementation and pass after the mobile foundation is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement mobile adoption flows.
- Do not implement donation checkout UI.
- Do not implement shelter dashboards.
- Do not connect Expo to Supabase, R2 or worker services.

## 4. Completion Notes

- Implemented a Portuguese-first Expo foundation screen using React Native primitives.
- Added typed mobile foundation content so copy, action state and readiness items can be tested outside React Native rendering.
- Confirmed the content contract has clean UTF-8 PT-PT copy, exposes foundation readiness and includes no navigation targets for unimplemented product flows.
