# Work-Item: WEB-DONOR-ADOPTION-LIST-001 — Web Donor Adoption List Product Boundary

## 1. Context & Problem

`DONOR-ADOPTION-LIST-CLIENT-001` added `createAdoptionDonorListClient`.

The Web product layer needs a state-machine boundary that lets authenticated adopters
list their own adoption applications in PT-PT.

## 2. Acceptance Criteria

- [ ] Web donor adoption list product boundary added.
- [ ] 5 states: `idle | loading | loaded | empty | failed`.
- [ ] Boundary consumes injected `AdoptionDonorListClient` dependency.
- [ ] `loaded` state surfaces `applications`, `total`.
- [ ] `empty` state when `applications.length === 0`.
- [ ] `failed` state with sanitized reasons.
- [ ] All UI copy in PT-PT in `webAdoptionDonorListUiContent` with `locale === 'pt-PT'` and `status === 'product-flow-ready'`.
- [ ] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.adoptionDonorList`.
- [ ] Tests — failing before implementation, passing after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser auth session.
- Do not implement Mobile boundary (separate work item).

## 4. Completion Notes

<!-- To be filled in when merged -->
