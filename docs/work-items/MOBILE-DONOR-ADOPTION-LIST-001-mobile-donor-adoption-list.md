# Work-Item: MOBILE-DONOR-ADOPTION-LIST-001 — Mobile Donor Adoption List Product Boundary

## 1. Context & Problem

`DONOR-ADOPTION-LIST-CLIENT-001` added `createAdoptionDonorListClient`.
`WEB-DONOR-ADOPTION-LIST-001` added the Web boundary.

The Mobile product layer needs its own state-machine boundary mirroring the Web boundary,
adapted for mobile UX conventions and PT-PT copy prefixed with `Mobile`.

## 2. Acceptance Criteria

- [ ] Mobile donor adoption list product boundary added.
- [ ] 5 states: `idle | loading | loaded | empty | failed`.
- [ ] Boundary consumes injected `AdoptionDonorListClient` dependency.
- [ ] `loaded` state surfaces `applications`, `total`.
- [ ] `empty` state when `applications.length === 0`.
- [ ] `failed` state with sanitized reasons.
- [ ] All UI copy in PT-PT in `mobileAdoptionDonorListUiContent` with `locale === 'pt-PT'` and `status === 'product-flow-ready'`.
- [ ] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.adoptionDonorList`.
- [ ] Tests — failing before implementation, passing after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native auth session.
- Do not implement Web boundary (separate work item).

## 4. Completion Notes

<!-- To be filled in when merged -->
