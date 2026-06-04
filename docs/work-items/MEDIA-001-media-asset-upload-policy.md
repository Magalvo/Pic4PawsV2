# Work-Item: MEDIA-001-Media Asset Upload Policy

## 1. Context & Problem

The approved architecture uses Cloudflare R2 for pet media and private documents, with signed upload URLs generated server-side. `DB-001` defined the `media_assets` table, and `PETS-001` requires at least one public image before publishing a pet. The project still needs shared media policy contracts before workers, web forms or mobile uploads can safely request signed upload URLs.

This task defines which uploads may be public, which must be private, and what object-key/metadata contract future R2 adapters must follow.

## 2. Acceptance Criteria

- [x] Public pet and shelter images can request public signed uploads only for image MIME types.
- [x] Adoption documents, identity documents and medical records are always private.
- [x] Upload requests require an authenticated owner or shelter scope.
- [x] Generated object keys are tenant-scoped and do not include raw filenames.
- [x] Unsupported MIME types and invalid byte sizes are rejected.
- [x] Tests fail before implementation and pass after the media upload policy contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Cloudflare R2.
- Do not generate real signed URLs.
- Do not process, resize or moderate images.
- Do not implement upload UI or API routes.

## 4. Completion Notes

- Added pure media upload policy contracts for public pet/shelter images and private adoption, identity and medical documents.
- Added deterministic object-key generation that scopes by shelter or user and excludes raw filenames.
- Kept real R2 signed URL generation, image processing and API/UI work outside this task.
- Full validation passed with Node `22.22.3`.
