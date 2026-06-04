# R2 Local Dry Run

This guide is for reviewing Pic4Paws media storage contracts without connecting to Cloudflare.

No Cloudflare account, token, access key or secret key should be used during this phase.

## Scope

- Public pet and shelter images map to the public R2 bucket.
- Adoption documents, identity documents and medical records map to the private R2 bucket.
- Object keys come from the approved media policy and must not include raw filenames.
- This phase does not generate signed URLs.

## Safe Dry Run

1. Review `packages/domain/src/media-policy.ts`.
2. Review `packages/config/src/r2.ts`.
3. Validate dry-run upload metadata through tests.

Do not use `wrangler r2 object put`, `wrangler r2 bucket delete`, `wrangler secret put`, `--remote`, Cloudflare API tokens or R2 access keys in this phase.
