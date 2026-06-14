---
id: WEB-PET-FEED-PAGE-001
title: Web pet feed page
status: in-progress
---

# Work-Item: WEB-PET-FEED-PAGE-001 — Web Pet Feed Page

## Goal

Create the real pet feed page at `/animais` wired to `createWebPetFeedUi`. Establish the worker client factory pattern (`apps/web/src/env.ts` + module-level client) used by all subsequent web pages.

## States

- `idle` — initial state, show call-to-action
- `loading` — local React pending state while `loadFeed` promise resolves
- `loaded` — show pet cards grid
- `empty` — no pets match query
- `failed` — network/worker error with retry

## Contract

### Environment

`NEXT_PUBLIC_WORKER_URL` must be set in `.env.local` (development) or the deployment environment. The `.env.example` file documents this variable.

### Exports

`apps/web/src/env.ts` exports:
```typescript
export const workerUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!url) throw new Error('NEXT_PUBLIC_WORKER_URL is not set');
  return url;
};
```

`apps/web/app/animais/page.tsx` is a `'use client'` Next.js App Router page that:
- Creates `PetFeedClient` via `createPetFeedClient({ workerBaseUrl: workerUrl() })`
- Creates the boundary UI via `createWebPetFeedUi({ feedClient })`
- Manages state with `useState` / `useEffect`
- Renders one branch per state

## Affected Files

- `docs/work-items/WEB-PET-FEED-PAGE-001-web-pet-feed-page.md` (this file)
- `.env.example` — add `NEXT_PUBLIC_WORKER_URL`
- `apps/web/src/env.ts` — new: `workerUrl()` helper
- `apps/web/app/animais/page.tsx` — new: pet feed Client Component
- `tests/web/env-wiring.test.ts` — new: verifies `workerUrl()` reads the env var
