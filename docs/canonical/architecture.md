# Architecture

Status: Superseded by pending proposal in `docs/canonical/architecture-proposal.md`.

This file records the initial boilerplate shape only. The approved production architecture must come from `architecture-proposal.md` after human review.

## System Shape

The current exploratory Pic4Paws V2 boilerplate is structured as a small TypeScript monorepo:

- `apps/web`: React/Vite application for adopters and shelters.
- `apps/api`: Express API boundary for future persistence, auth and integrations.
- `packages/domain`: shared domain types, fixtures and pure behavior.
- `tests`: cross-package tests that describe expected behavior.

## Boundaries

The web app may render mock data from `packages/domain` while the API is being rebuilt. Business calculations and validation rules should live in `packages/domain` before being wired into UI or API handlers.

## Future Integrations

The legacy app used MongoDB, Firebase Auth, Cloudinary, Petfinder, Google Maps and Socket.IO. These are reference signals only, not commitments. The final stack is pending approval and should prioritize PT-PT, GDPR, low cost, media scalability and Portuguese payment methods.
