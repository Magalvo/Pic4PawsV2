---
id: MEDIA-URL-WORKER-001
title: Real pet images — GET /media/:mediaId/url Worker route + web img
status: done
pr: 0
---

# Work-Item: MEDIA-URL-WORKER-001 — Real Pet Images

## Goal

Replace the emoji placeholder in the pet feed card and pet profile hero with real
images fetched via a signed R2 URL returned by a new Worker route.

## States

- pending: pet cards and profile hero show a species emoji placeholder; no image is
  ever loaded from R2
- done: `GET /media/:mediaId/url` Worker route returns a 15-minute presigned R2
  GetObject URL for public media assets; web card and profile hero render `<img>` when
  a `heroMediaId` is present, falling back to the emoji when no media is set

## Contract

**Worker route** — `GET {WORKER_MEDIA_URL_PATH}/:mediaId/url` (default `/media/:mediaId/url`)

Response 200:
```json
{ "url": "https://...", "expiresAt": "ISO8601", "mediaId": "..." }
```

Response 404: `{ "status": "not_found" }` — media asset not in DB  
Response 403: `{ "status": "forbidden" }` — visibility is private  
Response 501: `{ "status": "download_signer_not_configured" }` — no R2 signer wired  

No authentication required for public media. Private media returns 403 (reserved for
future authenticated download flow).

**Client** — `createMediaUrlClient({ workerBaseUrl, mediaUrlPath, fetch }).getMediaUrl(mediaId)`

Returns `{ ok: true; url; expiresAt; mediaId }` or `{ ok: false; status }`.

## Affected Files

- `packages/config/src/env.ts` — `WORKER_MEDIA_URL_PATH` schema + `EnvironmentConfig.workers.mediaUrlPath`
- `apps/workers/wrangler.toml` — `WORKER_MEDIA_URL_PATH = "/media"`
- `apps/workers/src/media-url.ts` — handler core + types
- `apps/workers/src/media-url-supabase.ts` — Supabase `MediaAssetReadRepository`
- `apps/workers/src/r2-signer.ts` — `createR2DownloadSigner` + `createR2DownloadSignerWorkerDependencies`
- `apps/workers/src/routes/media.ts` — extends existing media route to dispatch GET
- `apps/workers/src/dependencies.ts` — `mediaAssetReadRepository` + `mediaDownloadSigner` wiring
- `apps/workers/src/index.ts` — download signer wired in `fetch()` + new exports
- `packages/client/src/media.ts` — `MediaUrlClient` + `createMediaUrlClient`
- `apps/web/app/animais/page.tsx` — `PetCard` loads `heroMediaId` URL → `<img>`
- `apps/web/app/animais/[petId]/page.tsx` — `PetProfileLoaded` loads hero URL → `<img>`
- `tests/workers/media-url-boundary.test.ts` — boundary tests
- `docs/work-items/MEDIA-URL-WORKER-001-media-url-worker.md` (this file)
