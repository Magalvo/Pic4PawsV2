---
id: MEDIA-URL-PATH-ENV-001
title: Propagate WORKER_MEDIA_URL_PATH to web and mobile clients via env
status: done
---

# Work-Item: MEDIA-URL-PATH-ENV-001 — Env-Driven Media URL Path

## Context & Problem

P2 from `docs/audits/2026-06-30-sdd-audit-prs-295-313.md`:

MEDIA-URL-WORKER-001 (PR #308) introduced `WORKER_MEDIA_URL_PATH` as an env-driven config
key so the path can be changed without touching source code. However, all four client
callsites that use `createMediaUrlClient` hardcode `mediaUrlPath: '/media'`:

- `apps/web/app/animais/page.tsx:25`
- `apps/web/app/animais/[petId]/page.tsx:46`
- `apps/mobile/app/(app)/(tabs)/animais/index.tsx:25`
- `apps/mobile/app/animais/[petId]/index.tsx:51`

If `WORKER_MEDIA_URL_PATH` is changed from `/media` on the worker, image loading on all
four screens silently breaks because the clients still request `/media`.

## Goal

Expose `WORKER_MEDIA_URL_PATH` to web (via `NEXT_PUBLIC_WORKER_MEDIA_URL_PATH`) and mobile
(via `EXPO_PUBLIC_WORKER_MEDIA_URL_PATH`), export a `mediaUrlPath()` helper from each
app's env module, and replace the four literal `'/media'` strings with the helper.

## States

No new ViewModel states. Pure configuration-plumbing change.

## Contract

### `.env.example` (root)
- Add `NEXT_PUBLIC_WORKER_MEDIA_URL_PATH=/media` under the Web app section.
- Add `EXPO_PUBLIC_WORKER_MEDIA_URL_PATH=/media` under a new Mobile app section.

### `apps/web/src/env.ts`
- Add `mediaUrlPath(): `/${string}`` that reads `NEXT_PUBLIC_WORKER_MEDIA_URL_PATH`,
  defaults to `'/media'` if unset.

### `apps/mobile/src/env.ts`
- Add `mediaUrlPath(): `/${string}`` that reads `EXPO_PUBLIC_WORKER_MEDIA_URL_PATH`,
  defaults to `'/media'` if unset.

### Callsites (4 files)
- Replace `mediaUrlPath: '/media'` with `mediaUrlPath: mediaUrlPath()` in all four
  files, importing `mediaUrlPath` from the respective `../src/env` (web) or `../../src/env`
  (mobile) module.

### No behaviour change at runtime
- Default is still `/media` in all environments. Existing tests continue to pass.

## Acceptance Criteria

- [x] `.env.example` has `NEXT_PUBLIC_WORKER_MEDIA_URL_PATH=/media` and
      `EXPO_PUBLIC_WORKER_MEDIA_URL_PATH=/media`
- [x] `apps/web/src/env.ts` exports `mediaUrlPath()`
- [x] `apps/mobile/src/env.ts` exports `mediaUrlPath()`
- [x] All four `mediaUrlPath: '/media'` literals replaced
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` pass

## Non-Goals

- Do not change the worker-side `WORKER_MEDIA_URL_PATH` handling — it is already correct.
- Do not add runtime validation (the path always has a valid default).

## Affected Files

- `docs/work-items/MEDIA-URL-PATH-ENV-001-env-driven-media-url-path.md` (this file)
- `.env.example`
- `apps/web/src/env.ts`
- `apps/mobile/src/env.ts`
- `apps/web/app/animais/page.tsx`
- `apps/web/app/animais/[petId]/page.tsx`
- `apps/mobile/app/(app)/(tabs)/animais/index.tsx`
- `apps/mobile/app/animais/[petId]/index.tsx`
