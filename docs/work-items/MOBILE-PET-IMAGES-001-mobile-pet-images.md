---
id: MOBILE-PET-IMAGES-001
title: Mobile real pet images — feed card + profile hero
status: done
pr: 0
---

# Work-Item: MOBILE-PET-IMAGES-001 — Mobile Real Pet Images

## Goal

Replace the emoji placeholders in the mobile pet feed card grid and pet profile hero
with real images fetched via the signed R2 URL route added in MEDIA-URL-WORKER-001.

## States

- pending: mobile pet feed cards and profile hero show species emoji on a teal
  gradient placeholder; `heroMediaId` is loaded but never used
- done: `PetCard` and `PetProfileLoaded` fetch `heroMediaId` URL on mount via
  `createMediaUrlClient` and render a React Native `<Image>` with emoji fallback
  when no media is set

## Contract

Pure UI change. Reuses the existing `GET /media/:mediaId/url` Worker route and
`createMediaUrlClient` from `@pic4paws/client` (MEDIA-URL-WORKER-001).
No new Worker routes, repositories, or client functions.

Image is loaded asynchronously after the pet data is available; emoji is shown
until the URL resolves or if `heroMediaId` is null.

## Affected Files

- `apps/mobile/app/(app)/(tabs)/animais/index.tsx` — `PetCard` adds `imgUrl` state + `<Image>`
- `apps/mobile/app/animais/[petId]/index.tsx` — `PetProfileLoaded` adds `imgUrl` state + `<Image>`
- `docs/work-items/MOBILE-PET-IMAGES-001-mobile-pet-images.md` (this file)
