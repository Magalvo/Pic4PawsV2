# Legacy App Audit

## Current Reference Structure

The `reference` folder contains:

- `Pic4Paws-Client`: React/Vite JavaScript SPA with MUI, Chakra, Redux, Firebase, Petfinder and Socket.IO client usage.
- `Pic4Paws-Server`: Express/Mongoose API for auth, users, posts, pets, conversations, messages, breeds and external animal APIs.
- `Pic4Paws-Socket`: standalone Socket.IO server for authenticated chat presence and message delivery.

## Core Product Capabilities Found

- Public hero and auth flow.
- Private social home/feed.
- Pet adoption listing and pet details.
- User profiles and edit user screen.
- Pet creation/editing.
- Messaging with conversations and online users.
- Breed detail pages.
- External pet API integration.

## Technical Risks To Address In V2

- JavaScript-only code makes contracts implicit.
- UI stack is mixed across MUI, Chakra and custom CSS.
- API, client and socket concerns are split into separate projects without shared domain types.
- Several route handlers return inconsistent response shapes.
- Secret-backed integrations need a stricter environment and config boundary.

## Remake Direction

Build V2 from scratch. The legacy app is strictly a functional and business-logic reference.

Do not copy:

- Legacy architecture.
- Mixed MUI/Chakra/custom CSS approach.
- JavaScript-only domain contracts.
- Route/controller patterns without validation and authorization redesign.
- Payment, upload, auth or realtime implementation details without a fresh security review.

The next approved direction must come from `docs/canonical/architecture-proposal.md`, followed by `docs/canonical/sdd.md`.
