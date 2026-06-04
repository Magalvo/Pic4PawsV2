# Work-Item: UPLOAD-001-Worker Media Upload Request Contract

## 1. Context & Problem

`MEDIA-001` defined the allowed media upload policy and `R2-001` defined public/private bucket mapping. The Worker still needs a request contract for future signed upload URL generation. Before real signing exists, the Worker should validate media upload requests, map them to R2 upload metadata and return a safe "signer not configured" response without creating production signed URLs.

## 2. Acceptance Criteria

- [x] Worker environment config exposes a media upload request path.
- [x] The Worker rejects non-POST media upload requests.
- [x] The Worker rejects invalid JSON and invalid upload payloads without leaking secrets.
- [x] Valid upload requests are evaluated through the approved media policy and R2 bucket contract.
- [x] The response includes bucket name, object key, content type, byte size and visibility, but no real signed URL.
- [x] Tests fail before implementation and pass after the upload request contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not generate real signed URLs.
- Do not upload files to R2.
- Do not connect to Cloudflare.
- Do not persist media assets to Supabase.
- Do not implement client upload UI.

## 4. Completion Notes

- Added a typed Worker media upload request path through the environment contract.
- Added Worker-side upload intent creation using the approved media policy and R2 bucket mapping.
- Added `/uploads/media` boundary behavior for method rejection, invalid JSON, invalid upload payloads and valid dry-run upload intents.
- Kept `signedUrl` as `null` and returned `upload_signer_not_configured`; no Cloudflare calls, signed URL generation or database writes were added.
