# Work-Item: R2-001-R2 Bucket Contracts and Upload Dry Run

## 1. Context & Problem

`MEDIA-001` defined the media upload policy and object-key contract, while `ENV-001` defined required Cloudflare R2 environment variables. The project still needs a safe R2 infrastructure contract that maps public/private media to buckets and documents a local dry-run flow without real credentials or signed upload URLs.

## 2. Acceptance Criteria

- [x] R2 bucket contracts distinguish public media from private documents.
- [x] Bucket names come from typed environment/config values and public/private buckets cannot be the same.
- [x] Upload dry-run helpers map approved media upload contracts to bucket/key/content-type metadata without generating real signed URLs.
- [x] Local R2 guidance exists and contains no access keys, tokens or secrets.
- [x] The dry-run plan rejects production-risk Cloudflare commands, remote flags, destructive bucket/object deletion and secret writes.
- [x] Tests fail before implementation and pass after R2 contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Cloudflare.
- Do not create buckets.
- Do not upload files to R2.
- Do not generate real signed URLs.
- Do not add Cloudflare credentials to the repository.

## 4. Completion Notes

- Added typed R2 bucket contracts derived from environment config, with public/private bucket separation.
- Added dry-run upload metadata mapping from approved media contracts without generating signed URLs.
- Added local R2 dry-run guidance and command safety checks for destructive or remote Cloudflare flows.
- No Cloudflare CLI command was executed, no buckets were created and no credentials were added.
