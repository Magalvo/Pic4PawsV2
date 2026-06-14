# Work-Item: DOMAIN-CANON-001-Canonical Domain Public API

## Goal

`@pic4paws/domain` must expose only approved, Portugal-first domain contracts from the canonical SDD. Prototype feed fixtures and US demo data must not be part of the package public API.

## States

- `canonical_api`: public exports contain stable domain types, enum value lists and pure rules aligned with the SDD.
- `prototype_fixture`: demo objects and lookup helpers live outside the public package entrypoint.
- `pt_first_locale`: locale defaults and supported locale values start with `pt-PT`.
- `fixture_leak_blocked`: public runtime exports do not expose Austin/Seattle sample shelters, pets or feed posts.

## Contract

- Public domain exports must include canonical contracts for locale, shelter, pet, adoption, donation/payment and sponsorship settings.
- Public species/status/provider/method value lists must match the SDD values.
- `@pic4paws/domain` must not export `pets`, `shelters`, `feedPosts`, `findPetById`, `findShelterById`, `AdoptionStatus`, `PetProfile`, `NewPetDraft`, or other prototype-only public API.
- Existing consumers must import only canonical types/rules from the package entrypoint.

## Affected files

- `packages/domain/src/index.ts`
- `tests/domain/domain-canonical-contract.test.ts`
- `tests/domain/pets.test.ts`
