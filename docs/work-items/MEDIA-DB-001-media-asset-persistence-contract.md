# Work-Item: MEDIA-DB-001-Media Asset Persistence Contract

## 1. Context & Problem

`UPLOAD-001` and `SIGNER-001` produce validated media upload intents, but the database boundary still needs a safe contract for persisting approved uploads as `media_assets` records. The persistence shape must keep R2 object metadata and ownership, while avoiding storage of signed URLs or other temporary signer data.

## 2. Acceptance Criteria

- [x] A media asset persistence helper maps signed upload intents to `media_assets` insert contracts.
- [x] The insert contract includes media id, owner/shelter scope, R2 object key, MIME type, visibility and audit timestamps.
- [x] Signed URLs and expiry values are not persisted.
- [x] Unsigned upload intents are rejected.
- [x] Uploads without owner or shelter scope are rejected.
- [x] Tests fail before implementation and pass after the persistence contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Supabase.
- Do not insert rows into a live database.
- Do not upload files to R2.
- Do not implement client upload UI.
- Do not process image dimensions from actual files.

## 4. Completion Notes

- Added a database-side media asset insert contract for signed upload intents.
- Enriched Worker upload intents with media kind and ownership scope needed by persistence adapters.
- Ensured signed URLs and signer expiry values are omitted from persisted media metadata.
- Rejected unsigned intents and uploads without owner/shelter scope.
- No Supabase connection, database insert, R2 upload or client UI was added.
